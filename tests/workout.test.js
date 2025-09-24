const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const api = supertest(app);
const User = require("../models/userModel");
const Workout = require("../models/workoutModel");
const workouts = require("./data/workouts.js");

let token = null;

beforeAll(async () => {
  await User.deleteMany({});
  const result = await api
    .post("/api/user/signup")
    .send({ email: "mattiv@matti.fi", password: "R3g5T7#gh" });

  token = result.body.token;
});

describe("when there are workouts saved", () => {
  let workoutId;

  beforeEach(async () => {
    await Workout.deleteMany({});

    const response = await api
      .post("/api/workouts")
      .set("Authorization", "bearer " + token)
      .send(workouts[0])
      .expect(201);

    workoutId = response.body._id; // save ID for later tests
  });

  it("should return workouts as JSON", async () => {
    await api
      .get("/api/workouts")
      .set("Authorization", "bearer " + token)
      .expect(200)
      .expect("Content-Type", /application\/json/);
  });

  it("should add a new workout successfully", async () => {
    const newWorkout = { title: "testworkout", reps: 10, load: 100 };

    await api
      .post("/api/workouts")
      .set("Authorization", "bearer " + token)
      .send(newWorkout)
      .expect(201);

    const response = await api
      .get("/api/workouts")
      .set("Authorization", "bearer " + token);

    expect(response.body).toHaveLength(2); // one from beforeEach + new one
  });

  it("should fetch a single workout by ID", async () => {
    const response = await api
      .get(`/api/workouts/${workoutId}`)
      .set("Authorization", "bearer " + token)
      .expect(200)
      .expect("Content-Type", /application\/json/);

    expect(response.body._id).toBe(workoutId);
    expect(response.body.title).toBe(workouts[0].title);
  });

  it("should update a workout successfully", async () => {
    const updatedWorkout = { title: "Updated workout", reps: 20, load: 200 };

    const response = await api
      .patch(`/api/workouts/${workoutId}`)
      .set("Authorization", "bearer " + token)
      .send(updatedWorkout)
      .expect(200);

    expect(response.body.title).toBe("Updated workout");
    expect(response.body.reps).toBe(20);
    expect(response.body.load).toBe(200);
  });

  it("should delete a workout successfully", async () => {
    await api
      .delete(`/api/workouts/${workoutId}`)
      .set("Authorization", "bearer " + token)
      .expect(200);

    const workoutsAtEnd = await api
      .get("/api/workouts")
      .set("Authorization", "bearer " + token);

    expect(workoutsAtEnd.body).toHaveLength(0);
  });
});

afterAll(() => {
  mongoose.connection.close();
});
