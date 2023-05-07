process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../app");
const db = require("../db");

// isbn of sample book
let book_isbn;

let reqBody = {
  isbn: "123456789",
  "amazon-url": "http://amazon.com/hat",
  author: "Testy Testein",
  language: "JavaScript",
  pages: 666,
  publisher: "Satan",
  title: "Coding Hell",
  year: 412,
};

let badReqBody = {
  isbn: "123456789",
  "amazon-url": 4566,
  language: "JavaScript",
  pages: "Gary farted",
  publisher: "Satan",
  title: "Coding Hell",
  year: "Bacon bits!",
};

beforeEach(async () => {
  let result = await db.query(`
      INSERT INTO
        books (isbn, amazon_url,author,language,pages,publisher,title,year)
        VALUES(
          '123432122',
          'https://amazon.com/tacocat',
          'Matt Long',
          'Spanish',
          69,
          'We publish bad books inc',
          'Tacocat and BurritoBuddy', 2123)
        RETURNING isbn`);

  book_isbn = result.rows[0].isbn;
});

describe("GET /books", function () {
  test("Gets a list of books", async function () {
    const res = await request(app).get(`/books`);
    const books = res.body.books;
    expect(books).toHaveLength(1);
    expect(books[0]).toHaveProperty("language");
    expect(books[0].language).toEqual("Spanish");
  });
});

describe("GET/books:isbn", function () {
  test("Gets a single book by it's isbn", async function () {
    const res = await request(app).get(`/books/${book_isbn}`);
    expect(res.body.book).toHaveProperty("title");
    expect(res.body.book.title).toEqual("Tacocat and BurritoBuddy");
    expect(res.body.book.pages).toEqual(69);
  });
});

describe("POST /books", function () {
  test("Create a book", async function () {
    const res = await request(app).post(`/books`).send(reqBody);
    expect(res.statusCode).toBe(201);
    expect(res.body.book.title).toEqual("Coding Hell");
  });
  test("Create book without required data", async function () {
    const res = await request(app).post(`/books`).send(badReqBody);
    expect(res.statusCode).toBe(400);
  });
});

describe("PUT /books:id", function () {
  test("Updates a single book", async function () {
    const res = await request(app).put(`/books/${book_isbn}`).send(reqBody);
    expect(res.body.book).toHaveProperty("isbn");
    expect(res.body.book.publisher).toBe("Satan");
    expect(res.body.book.pages).toEqual(666);
  });
  test("Prevent bad update", async function () {
    const res = await request(app).put(`/books/${book_isbn}`).send(
      badReqBody
    );
    expect(res.statusCode).toBe(400);
  });
});

describe("DELETE /books/:id", function () {
  test("Deletes a single a book", async function () {
    const response = await request(app).delete(`/books/${book_isbn}`);
    expect(response.body).toEqual({ message: "Book deleted" });
  });
});

afterEach(async function () {
  await db.query("DELETE FROM BOOKS");
});

afterAll(async function () {
  await db.end();
});
