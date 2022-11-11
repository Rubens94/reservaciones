const { expect } = require('chai');
const sinon = require("sinon");
const UserController = require('../controllers/users');
const Users = require('../models/users');
const Role = require('../models/roles');

describe('Users workflow tests', () => {
    const userOne = {
        "id": 1,
        "name": "Prueba",
        "lastname": "Prueba",
        "roleId": 2,
        "email": "prueba@prueba.com",
        "password": "$2b$10$4RlUwDKriqHaVFdLLWwQTOzg2oEbjg0CQuZcNxaoZls/cFhpkSzf6"
    }

    const userTwo = {
        "id": 2,
        "name": "Juan",
        "lastname": "Madrigal",
        "roleId": 2,
        "email": "juan@gmail.com",
        "password": "qwerty123456"
    }

    const userThree = {
        "id": 2,
        "name": "Sonia",
        "lastname": "Prado",
        "roleId": 2,
        "email": "sonia@gmail.com",
        "password": "$2b$10$4RlUwDKriqHaVFdLLWwQTOzg2oEbjg0CQuZcNxaoZls/cFhpkSzf6"
    }
    describe('/api/users', () => {
        let status, json, res;

        beforeEach(() => {
            status = sinon.stub();
            json = sinon.spy();
            res = { json, status };
            status.returns(res);
        });
        
        afterEach(()=> { 
            sinon.verifyAndRestore(); 
        });

        it('POST /api/users: should add a new user in DB', async() => {
            const req = {
                body: {
                    "name": "Prueba",
                    "lastname": "Prueba",
                    "email": "prueba@prueba.com",
                    "password": "qwerty123456"
                }
            };
            let stub = sinon.stub(Users, 'create').returns(userOne);
            await UserController.createUser( req, res );
            expect(stub.calledOnce).to.be.true;
            expect(status.calledOnce).to.be.true;
            expect(status.args[0][0]).to.equal(200);
            expect(json.calledOnce).to.be.true;
            expect(json.args[0][0].msg).to.equal('User created');
        });

        it('POST /api/users: should send an error for the existing user', async() => {
            const req = {
                body: {
                    "name": "Juan",
                    "lastname": "Madrigal",
                    "email": "juan@gmail.com",
                    "password": "qwerty123456"
                }
            };
            let stub = sinon.stub(Users, 'findOne').returns(userTwo);
            await UserController.createUser( req, res );
            expect(stub.calledOnce).to.be.true;
            expect(status.calledOnce).to.be.true;
            expect(status.args[0][0]).to.equal(400);
            expect(json.calledOnce).to.be.true;
            expect(json.args[0][0].msg).to.equal('the email already exists, try with another.');
        });

        it('POST /api/users: should send an error in DB', async() => {
            const req = {
                body: {
                    "name": "Juan",
                    "lastname": "Madrigal",
                    "email": "juan@gmail.com",
                    "password": "qwerty123456"
                }
            };
            let stub = sinon.stub(Users, 'create').rejects(userTwo);
            await UserController.createUser( req, res );
            expect(status.args[0][0]).to.equal(500);
            expect(json.args[0][0].msg).to.equal('Server error, contact administrator');
        });

        it('POST /api/users/login: should generate JWT with login', async() => {
            const req = {
                body: {
                    "email": "sonia@gmail.com",
                    "password": "qwerty123456"
                }
            };
            let stub = sinon.stub(Users, 'findOne').returns(userThree);
            await UserController.login( req, res );
            expect(stub.calledOnce).to.be.true;
            expect(status.calledOnce).to.be.true;
            expect(status.args[0][0]).to.equal(200);
            expect(json.calledOnce).to.be.true;
        });

        it('POST /api/users/login: should send a error for wrong password', async() => {
            const req = {
                body: {
                    "email": "sonia@gmail.com",
                    "password": "qwerty1234567"
                }
            };
            let stub = sinon.stub(Users, 'findOne').returns(userThree);
            await UserController.login( req, res );
            expect(stub.calledOnce).to.be.true;
            expect(status.calledOnce).to.be.true;
            expect(status.args[0][0]).to.equal(400);
            expect(json.calledOnce).to.be.true;
            expect(json.args[0][0].msg).to.equal('wrong password');
        });

    });
});