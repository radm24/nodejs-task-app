const request = require('supertest');
const app = require('../src/app');
const Task = require('../src/models/task');
const { userOne, userOneId, userTwoId, userTwo, taskOne, taskTwo, taskThree, setupDatabase } = require('./fixtures/db');

beforeEach(setupDatabase);

test('Should create task for user', async () => {
    const response = await request(app)
            .post('/tasks')
            .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
            .send({
                description: "Create a test task"
            })
            .expect(201)
    const task = await Task.findById(response.body._id);
    expect(task).not.toBeNull();
    expect(task.completed).toBe(false);
})

test('Should not create task with invalid completed field', async () => {
    await request(app)
            .post('/tasks')
            .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
            .send({
                description: "Create a test task",
                completed: "nope"
            })
            .expect(400)
})

test('Should fetch user tasks', async () => {
    const response = await request(app)
            .get('/tasks')
            .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
            .send()
            .expect(200)
    expect(response.body.length).toBe(2);
})

test('Should fetch user task by id', async () => {
    const response = await request(app)
            .get(`/tasks/${taskTwo._id}`)
            .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
            .send()
            .expect(200)
    expect(response.body).not.toBeNull();
})

test('Should not fetch user task by id if unauthenticated', async () => {
    await request(app)
            .get(`/tasks/${taskTwo._id}`)
            .send()
            .expect(401)
})

test('Should not fetch other users task by id', async () => {
    await request(app)
            .get(`/tasks/${taskTwo._id}`)
            .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
            .send()
            .expect(404)
})

test('Should fetch only completed tasks', async () => {
    const response = await request(app)
            .get('/tasks/?completed=true')
            .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
            .send()
            .expect(200)
    expect(response.body.length).toBe(1);
})

test('Should fetch only incomplete tasks', async () => {
    const response = await request(app)
            .get('/tasks/?completed=true')
            .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
            .send()
            .expect(200)
    expect(response.body.length).toBe(1);
})

test('Should sort tasks by createdAt field', async () => {
    const response = await request(app)
            .get('/tasks/?sortBy=createdAt:desc')
            .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
            .send()
            .expect(200)
    const entriesCreatedTIme = response.body.map(entry => new Date(entry.createdAt).getTime());
    expect(entriesCreatedTIme[0]).toBeGreaterThan(entriesCreatedTIme[1]);
})

test('Should fetch page of tasks', async () => {
    const response = await request(app)
            .get('/tasks/?limit=1')
            .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
            .send()
            .expect(200)
    expect(response.body.length).toBe(1);
})

test('Should update valid task fields', async () => {
    await request(app)
            .patch(`/tasks/${taskThree._id}`)
            .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
            .send({
                description: 'Edited third task'
            })
            .expect(200)
    const task = await Task.findById(taskThree._id);
    expect(task.description).toBe('Edited third task');
})

test('Should not update invalid task fields', async () => {
    await request(app)
            .patch(`/tasks/${taskThree._id}`)
            .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
            .send({
                duration: "2 hours"
            })
            .expect(400)
})

test('Should not update other users task', async () => {
    await request(app)
            .patch(`/tasks/${taskOne._id}`)
            .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
            .send({
                description: 'Edited first task'
            })
            .expect(404)
})

test('Should not update task with invalid completed field', async () => {
    await request(app)
            .patch(`/tasks/${taskOne._id}`)
            .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
            .send({
                completed: 'must be boolean'
            })
            .expect(500)
})

test('Should not delete task if unauthenticated', async () => {
    await request(app)
            .delete(`/tasks/${taskOne._id}`)
            .send()
            .expect(401)
})

test('Should delete user task', async () => {
    const response = await request(app)
            .delete(`/tasks/${taskOne._id}`)
            .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
            .send()
            .expect(200)
    const task = await Task.findById(taskOne._id);
    expect(task).toBeNull();
})

test('Should not delete other users tasks', async () => {
    await request(app)
            .delete(`/tasks/${taskOne._id}`)
            .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
            .send()
            .expect(404)
    const task = await Task.findById(taskOne._id);
    expect(task).not.toBeNull();
})