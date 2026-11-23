import time
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin


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


if __name__ == "__main__":
    all_books = scrape_all_books()

    # Checks
    print(f"Done: scraped {len(all_books)} books")
    unique_urls = {book["url"] for book in all_books}
    print(f"Unique URLs: {len(unique_urls)}")
    print("Last book:", all_books[-1])

# 1. Download the page
response = requests.get(BASE_URL, timeout=10)
response.raise_for_status()      # stop with an error if the page failed to load
response.encoding = "utf-8"      # the site uses UTF-8 (otherwise £ shows up as Â£)

# 2. Turn the HTML text into a searchable object
soup = BeautifulSoup(response.text, "html.parser")

# 3. Find every book on the page
books = soup.find_all("article", class_="product_pod")
print(f"Found {len(books)} books on this page")

# 4. Turn every book into a clean dictionary
all_books = []
for book in books:
    all_books.append(parse_book(book, BASE_URL))

# 5. Check the results
print(all_books[0])          # the first book, in full
print(all_books[-1])         # the last book ([-1] means "last")
print(f"Parsed {len(all_books)} books")


