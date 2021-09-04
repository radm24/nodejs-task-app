const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/user');
const { userOne, userOneId, setupDatabase } = require('./fixtures/db');

jest.mock('../src/emails/account');

beforeEach(setupDatabase);

test('Should signup a new user', async () => {
    const response = await request(app)
            .post('/users')
            .send({
                name: 'Radik',
                email: 'radzex24@gmail.com',
                password: 'radik123!'
            })
            .expect(201);
    
    // Assertions that the user has been created correctly in the database
    const user = await User.findById(response.body.user._id);
    expect(user).not.toBeNull();

    // Assertions about the response
    expect(response.body).toMatchObject({
        user: {
            name: 'Radik',
            email: 'radzex24@gmail.com'
        },
        token: user.tokens[0].token
    });
    expect(user.password).not.toBe('radik123!');
})

test('Should not signup user with invalid email', async () => {
    await request(app)
            .post('/users')
            .send({
                name: 'Radik',
                email: 'radzex24.com',
                password: 'radik123!'
            })
            .expect(400)
})

test('Should login existing user', async () => {
    const response = await request(app)
            .post('/users/login')
            .send({
                email: userOne.email,
                password: userOne.password
            })
            .expect(200);
    const user = await User.findById(response.body.user._id);
    expect(response.body.token).toBe(user.tokens[1].token);
})

test('Should not login nonexistent user', async () => {
    await request(app)
            .post('/users/login')
            .send({
                email: 'kevin@test.com',
                password: 'kevin123!'
            })
            .expect(400);
})

test('Should get profile for user', async () => {
    await request(app)
            .get('/users/me')
            .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
            .send()
            .expect(200);
})

test('Should not get profile for unauthenticated user', async () => {
    await request(app)
            .get('/users/me')
            .send()
            .expect(401)
})

test('Should update valid user fields', async () => {
    await request(app)
            .patch('/users/me')
            .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
            .send({
                name: 'Kevin'
            })
            .expect(200)
    const user = await User.findById(userOneId);
    expect(user.name).toBe('Kevin');
})

test('Should not update user with invalid password', async () => {
    await request(app)
            .patch('/users/me')
            .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
            .send({
                password: 'short!'
            })
            .expect(400)
})

test('Should not update invalid user fields', async () => {
    await request(app)
            .patch('/users/me')
            .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
            .send({
                location: 'Moscow'
            })
            .expect(400)
})

test('Should not update user if unauthenticated', async () => {
    await request(app)
            .patch('/users/me')
            .send({
                name: 'Kevin'
            })
            .expect(401)
})

test('Should upload avatar image', async () => {
    await request(app)
            .post('/users/me/avatar')
            .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
            .attach('avatar', 'tests/fixtures/avatar.png')
            .expect(200)
    const user = await User.findById(userOneId);
    expect(user.avatar).toEqual(expect.any(Buffer));
})

test('Should not delete account for unauthenticated user', async () => {
    await request(app)
            .delete('/users/me')
            .send()
            .expect(401)
})

test('Should delete account for user', async () => {
    await request(app)
            .delete('/users/me')
            .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
            .send()
            .expect(200)
    const user = await User.findById(userOneId);
    expect(user).toBeNull();
})