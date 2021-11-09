const request = require("supertest");

process.env.NODE_ENV = "test";

const app = require("../app");
const db = require("../db");
const Book = require("../models/book");

const book = {
    "isbn": "0691161518",
    "amazon_url": "http://a.co/eobPtX2",
    "author": "Matthew Lane",
    "language": "english",
    "pages": 264,
    "publisher": "Princeton University Press",
    "title": "Power-Up: Unlocking the Hidden Mathematics in Video Games",
    "year": 2017
};

beforeEach(async () => {
    await db.query("DELETE FROM books");
    await Book.create(book);
});

afterAll(async () => {
    await db.end();
});

describe("GET /books", () => {
    test("can get all books from database", async () => {
        const response = await request(app).get("/books");
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({books: [book]});
    });
});

describe("GET /books/:id", () => {

    test("can get book of id", async () => {
        const response = await request(app).get(`/books/${book.isbn}`);
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({book});
    });

    test("returns error if id does not exist", async () => {
        const response = await request(app).get("/books/DNE");
        expect(response.statusCode).toBe(404);
        expect(response.body).toEqual({
            error: {
                message: "There is no book with an isbn 'DNE'",
                status: 404
            },
            message: "There is no book with an isbn 'DNE'",
        });
    });

});

describe("POST /books", () => {

    test("can create book", async () => {
        await db.query("DELETE FROM books");

        const response = await request(app)
            .post("/books")
            .send(book);
        
        expect(response.statusCode).toBe(201);
        expect(response.body).toEqual({book});
    });

    test("cannot create duplicate book", async () => {
        const response = await request(app)
            .post("/books")
            .send(book);
        
        expect(response.statusCode).toBe(500);
        expect(response.body).toEqual({
            "error": {
                "code": "23505",
                "constraint": "books_pkey",
                "detail": "Key (isbn)=(0691161518) already exists.",
                "file": "nbtinsert.c",
                "length": 191,
                "line": "563",
                "name": "error",
                "routine": "_bt_check_unique",
                "schema": "public",
                "severity": "ERROR",
                "table": "books",
            },
            "message": "duplicate key value violates unique constraint \"books_pkey\"",
        });
    });

    test("cannot create with empty request body", async () => {
        const response = await request(app).post("/books");
        
        expect(response.statusCode).toBe(400);
        expect(response.body).toEqual({
            error: {
                message: [
                    "instance requires property \"isbn\"",
                    "instance requires property \"amazon_url\"",
                    "instance requires property \"author\"",
                    "instance requires property \"language\"",
                    "instance requires property \"pages\"",
                    "instance requires property \"publisher\"",
                    "instance requires property \"title\"",
                    "instance requires property \"year\"",
                ],
                status: 400,
            },
            message: [
                "instance requires property \"isbn\"",
                "instance requires property \"amazon_url\"",
                "instance requires property \"author\"",
                "instance requires property \"language\"",
                "instance requires property \"pages\"",
                "instance requires property \"publisher\"",
                "instance requires property \"title\"",
                "instance requires property \"year\"",
            ],
        });
    });

    test("cannot create with incomplete request body", async () => {
        const { amazon_url, ...rest } = book;
        rest.isbn = "1234567890";
        const response  = await request(app)
            .post("/books")
            .send(rest);

        expect(response.statusCode).toBe(400);
        expect(response.body).toEqual({
            error: {
                message: [
                    "instance requires property \"amazon_url\""
                ],
                status: 400,
            },
            message: [
                "instance requires property \"amazon_url\"",
            ]
        });
    });

    test("can create book if are extra parameters than required", async () => {
        const extraBook = {...book, extra: "EXTRA"};
        extraBook.isbn = "1234567890";
        const response = await request(app)
            .post("/books")
            .send(extraBook);
        
        expect(response.statusCode).toBe(201);
        const {extra, ...rest} = extraBook;
        expect(response.body).toEqual({book: rest});
    });
});

describe("PUT books/:isbn", () => {

    test("can update book by isbn", async () => {
        const updatedBook = book;
        updatedBook.title = "NEW_TITLE";
        const response = await request(app)
            .put(`/books/${book.isbn}`)
            .send(updatedBook);
        
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({book: updatedBook});
    });

    test("cannot update book with incomplete request body", async () => {
        const { amazon_url, ...rest } = book;
        rest.title = "NEW_TITLE";
        const response  = await request(app)
            .put(`/books/${ book.isbn }`)
            .send(rest);

        expect(response.statusCode).toBe(400);
        expect(response.body).toEqual({
            error: {
                message: [
                    "instance requires property \"amazon_url\""
                ],
                status: 400,
            },
            message: [
                "instance requires property \"amazon_url\"",
            ]
        });
    });

    test("cannot update book with empty request body", async () => {
        const response = await request(app).put(`/books/${book.isbn}`);
        
        expect(response.statusCode).toBe(400);
        expect(response.body).toEqual({
            error: {
                message: [
                    "instance requires property \"isbn\"",
                    "instance requires property \"amazon_url\"",
                    "instance requires property \"author\"",
                    "instance requires property \"language\"",
                    "instance requires property \"pages\"",
                    "instance requires property \"publisher\"",
                    "instance requires property \"title\"",
                    "instance requires property \"year\"",
                ],
                status: 400,
            },
            message: [
                "instance requires property \"isbn\"",
                "instance requires property \"amazon_url\"",
                "instance requires property \"author\"",
                "instance requires property \"language\"",
                "instance requires property \"pages\"",
                "instance requires property \"publisher\"",
                "instance requires property \"title\"",
                "instance requires property \"year\"",
            ],
        });
    });
});