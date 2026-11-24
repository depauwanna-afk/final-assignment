import os
import streamlit as st
import pandas as pd
from dotenv import load_dotenv
from supabase import create_client

st.set_page_config(page_title="Books to Scrape explorer", page_icon="📚", layout="wide")


@st.cache_data(ttl=600)   # remember the data for 10 minutes instead of re-querying on every click
def load_books():
    """Read all books from Supabase using the publishable (read-only) key."""
    load_dotenv()
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_PUBLISHABLE_KEY")
    if not url or not key:
        return None

    supabase = create_client(url, key)

    # Supabase returns at most 1000 rows per request, so fetch in pages until none are left
    rows = []
    page_size = 1000
    start = 0
    while True:
        response = (
            supabase.table("books")
            .select("title, price, rating, in_stock, url")
            .range(start, start + page_size - 1)
            .execute()
        )
        rows.extend(response.data)
        if len(response.data) < page_size:
            break
        start += page_size

    books = pd.DataFrame(rows)
    books["price"] = books["price"].astype(float)
    return books


# ---------- Page ----------
st.title("📚 Books to Scrape explorer")
st.caption("Data scraped from books.toscrape.com and stored in Supabase.")

books = load_books()
if books is None:
    st.error("Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY. Copy .env.example to .env and fill in your own values.")
    st.stop()

# ---------- Filters (sidebar) ----------
st.sidebar.header("Filters")
search = st.sidebar.text_input("Search by title")

max_price = float(books["price"].max())
price_range = st.sidebar.slider("Price (£)", 0.0, max_price, (0.0, max_price))

min_rating = st.sidebar.slider("Minimum rating (stars)", 1, 5, 1)
in_stock_only = st.sidebar.checkbox("In stock only")

sort_option = st.sidebar.selectbox(
    "Sort by",
    ["Title (A–Z)", "Price (low to high)", "Price (high to low)", "Rating (high to low)"],
)

# ---------- Apply filters ----------
filtered = books[
    books["title"].str.contains(search, case=False, regex=False)
    & books["price"].between(price_range[0], price_range[1])
    & (books["rating"] >= min_rating)
]
if in_stock_only:
    filtered = filtered[filtered["in_stock"]]

# ---------- Apply sorting ----------
sort_rules = {
    "Title (A–Z)": ("title", True),
    "Price (low to high)": ("price", True),
    "Price (high to low)": ("price", False),
    "Rating (high to low)": ("rating", False),
}
column, ascending = sort_rules[sort_option]
filtered = filtered.sort_values(column, ascending=ascending)

# ---------- Results ----------
st.write(f"Showing **{len(filtered)}** of {len(books)} books")
st.dataframe(
    filtered,
    hide_index=True,
    width="stretch",
    column_config={
        "title": "Title",
        "price": st.column_config.NumberColumn("Price", format="£%.2f"),
        "rating": st.column_config.NumberColumn("Rating", format="%d ⭐"),
        "in_stock": "In stock",
        "url": st.column_config.LinkColumn("Link", display_text="Open"),
    },
)