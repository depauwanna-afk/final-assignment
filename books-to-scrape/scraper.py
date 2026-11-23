import requests
from bs4 import BeautifulSoup

BASE_URL = "https://books.toscrape.com/"

# 1. Download the page
response = requests.get(BASE_URL, timeout=10)
response.raise_for_status()      # stop with an error if the page failed to load
response.encoding = "utf-8"      # the site uses UTF-8 (otherwise £ shows up as Â£)

# 2. Turn the HTML text into a searchable object
soup = BeautifulSoup(response.text, "html.parser")

# 3. Find every book on the page
books = soup.find_all("article", class_="product_pod")
print(f"Found {len(books)} books on this page")

# 4. Print each book's full title
for book in books:
    title = book.h3.a["title"]
    print(title)

