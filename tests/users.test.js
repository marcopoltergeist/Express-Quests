const request = require("supertest");
const app = require("../src/app");
const database = require("../database");
const crypto = require("crypto");

describe("GET /api/users", () => {
  it("should return all users", async () => {
    const response = await request(app).get("/api/users");

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toEqual(200);
    expect(response.body.length).toBeGreaterThan(0);
  });
});

describe("GET /api/users/:id", () => {
  it("should return one user", async () => {
    const response = await request(app).get("/api/users/1");

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toEqual(200);
    expect(response.body.id).toEqual(1);
  });

  it("should return no user", async () => {
    const response = await request(app).get("/api/users/0");

    expect(response.status).toEqual(404);
  });
});

describe("POST /api/users", () => {
  it("should return created user", async () => {
    const newUser = {
      firstname: "Marie",
      lastname: "Martin",
      email: `${crypto.randomUUID()}@wild.co`,
      city: "Paris",
      language: "French",
    };

    const response = await request(app).post("/api/users").send(newUser);

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toEqual(201);
    expect(response.body).toHaveProperty("id");
    expect(typeof response.body.id).toBe("number");

    const [result] = await database.query(
      "SELECT * FROM users WHERE id=?",
      response.body.id
    );

    const [userInDatabase] = result;

    expect(userInDatabase).toHaveProperty("id");
    expect(userInDatabase.firstname).toEqual(newUser.firstname);
    expect(userInDatabase.lastname).toEqual(newUser.lastname);
    expect(userInDatabase.email).toEqual(newUser.email);
    expect(userInDatabase.city).toEqual(newUser.city);
    expect(userInDatabase.language).toEqual(newUser.language);
  });

  it("should return an error", async () => {
    const userWithMissingProps = { firstname: "Marie" };

    const response = await request(app)
      .post("/api/users")
      .send(userWithMissingProps);

    expect(response.status).toEqual(500);
  });

  describe("PUT /api/users/:id", () => {
    it("should edit user", async () => {
      const newUser = {
        firstname: "Renaud",
        lastname: "Turpin",
        email: "renaud.turpin@wildcodeschool.com",
        city: "Paris",
        language: "Francais",
      };

      const [result] = await database.query(
        "INSERT INTO users(firstname, lastname, email, city, language) VALUES (?, ?, ?, ?, ?)",
        [
          newUser.firstname,
          newUser.lastname,
          newUser.email,
          newUser.city,
          newUser.language,
        ]
      );

      const id = result.insertId;

      const updatedUser = {
        firstname: "Gabin",
        lastname: "Chameroy",
        email: "gabin.chameroy@example.com",
        city: "Barcelone",
        language: "Francais",
      };

      const response = await request(app)
        .put(`/api/users/${id}`)
        .send(updatedUser);

      expect(response.status).toEqual(204);

      const [users] = await database.query(
        "SELECT * FROM users WHERE id=?",
        id
      );

      const [userInDatabase] = users;

      expect(userInDatabase).toHaveProperty("id");
      expect(userInDatabase.firstname).toStrictEqual(updatedUser.firstname);
      expect(userInDatabase.lastname).toStrictEqual(updatedUser.lastname);
      expect(userInDatabase.email).toStrictEqual(updatedUser.email);
      expect(userInDatabase.city).toStrictEqual(updatedUser.city);
      expect(userInDatabase.language).toStrictEqual(updatedUser.language);
    });

    it("should return an error", async () => {
      const userWithMissingProps = { firstname: "Renaud" };

      const response = await request(app)
        .put(`/api/users/1`)
        .send(userWithMissingProps);

      expect(response.status).toEqual(500);
    });

    it("should return no user", async () => {
      const newUser = {
        firstname: "Renaud",
        lastname: "Turpin",
        email: "renaud.turpin@wildcodeschool.com",
        city: "Paris",
        language: "Francais",
      };

      const response = await request(app).put("/api/users/0").send(newUser);

      expect(response.status).toEqual(404);
    });
  });
});
