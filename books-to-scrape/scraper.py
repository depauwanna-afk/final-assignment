import os
import time
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from dotenv import load_dotenv
from supabase import create_client


BASE_URL = "https://books.toscrape.com/"
DELAY_SECONDS = 0.5   # pause between pages, to be polite to the website

# The site writes ratings as words; this dictionary translates them to numbers
RATINGS = {"One": 1, "Two": 2, "Three": 3, "Four": 4, "Five": 5}


def parse_book(book, page_url):
    """Take one <article class="product_pod"> and return a clean dictionary."""
    link = book.h3.a
    title = link["title"]

    # The link is relative ("catalogue/..."), so make it a full URL
    url = urljoin(page_url, link["href"])

    # "£51.77" -> 51.77
    price_text = book.find("p", class_="price_color").text
    price = float(price_text.replace("£", ""))

    # class="star-rating Three" -> ["star-rating", "Three"] -> "Three" -> 3
    rating_word = book.find("p", class_="star-rating")["class"][1]
    rating = RATINGS[rating_word]

    # "\n\n    In stock\n" -> "In stock" -> True
    availability = book.find("p", class_="availability").text.strip()
    in_stock = availability == "In stock"

    return {
        "title": title,
        "price": price,
        "rating": rating,
        "in_stock": in_stock,
        "url": url,
    }

def scrape_page(page_url):
    """Download one catalogue page. Return its books and the next page's URL (or None)."""
    response = requests.get(page_url, timeout=10)
    response.raise_for_status()      # stop with an error if the page failed to load
    response.encoding = "utf-8"      # the site uses UTF-8 (otherwise £ shows up as Â£)

    soup = BeautifulSoup(response.text, "html.parser")

    books = []
    for book in soup.find_all("article", class_="product_pod"):
        books.append(parse_book(book, page_url))

    # On the last page there is no <li class="next">, so find() returns None
    next_item = soup.find("li", class_="next")
    if next_item:
        next_url = urljoin(page_url, next_item.a["href"])
    else:
        next_url = None

    return books, next_url


def scrape_all_books():
    """Follow the 'next' links from page 1 to the last page and collect every book."""
    all_books = []
    page_url = BASE_URL
    page_number = 1

    while page_url:
        books, page_url = scrape_page(page_url)
        all_books.extend(books)      # add this page's books to the full list
        print(f"Page {page_number}: {len(books)} books (total so far: {len(all_books)})")
        page_number += 1

        if page_url:                 # only wait if there is another page to fetch
            time.sleep(DELAY_SECONDS)

    return all_books
def save_to_supabase(books):
    """Upsert all books into the Supabase 'books' table (url is the unique key)."""
    load_dotenv()   # read SUPABASE_URL and SUPABASE_SECRET_KEY from the .env file
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SECRET_KEY")

    if not url or not key:
        raise SystemExit(
            "Missing SUPABASE_URL or SUPABASE_SECRET_KEY. "
            "Copy .env.example to .env and fill in your own values."
        )

    supabase = create_client(url, key)

    batch_size = 500
    for start in range(0, len(books), batch_size):
        batch = books[start:start + batch_size]
        supabase.table("books").upsert(batch, on_conflict="url").execute()
        print(f"Saved books {start + 1}-{start + len(batch)} to Supabase")

if __name__ == "__main__":
    all_books = scrape_all_books()

    # Checks before saving
    print(f"Done: scraped {len(all_books)} books")
    unique_urls = {book["url"] for book in all_books}
    print(f"Unique URLs: {len(unique_urls)}")

    save_to_supabase(all_books)
    print("All books saved to Supabase")

