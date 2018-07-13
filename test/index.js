const rp = require('request-promise')
const { expect } = require('chai')
const _ = require('lodash')

const util_mongodb = require('../engine/util/mongodb/index')

describe('test API', function () {
	describe('test post /script', function () {
		it('should return 200 body with valid params', async () => {
			const options = {
				method: 'post',
				url: 'http://localhost:3000/script',
				body: {
					owner_id: '9527',
					name: 'longstay_alert'
				},
				json: true,
				resolveWithFullResponse: true,
			}
			const rs = await rp(options)
			expect(rs).not.to.be.null
			expect(rs).have.property('statusCode').eql(200)
			expect(rs).have.property('message').eql('Post script successfully')
			expect(rs).have.property('data')
			expect(rs.data).to.be.string
		})

		it('should return 400 body with nonexistent scriptfile name', async () => {
			const options = {
				method: 'post',
				url: 'http://localhost:3000/script',
				body: {
					owner_id: '6666',
					name: 'not_exist_script' // nonexistent filename
				},
				json: true,
				resolveWithFullResponse: true,
			}
			const rs = await rp(options)
			expect(rs).not.to.be.null
			expect(rs).have.property('statusCode').eql(400)
			expect(rs).have.property('message').eql('Invalid request body')
			expect(rs).have.property('data')
			expect(rs.data).to.be.empty
		})

		it('should return 400 body without both params', async () => {
			const options = {
				method: 'post',
				url: 'http://localhost:3000/script',
				body: {
					name: 'longstay_alert' // lack of owner_id
				},
				json: true,
				resolveWithFullResponse: true,
			}
			const rs = await rp(options)
			expect(rs).not.to.be.null
			expect(rs).have.property('statusCode').eql(400)
			expect(rs).have.property('message').eql('Lack of request params')
			expect(rs).have.property('data')
			expect(rs.data).to.be.empty
		})
	})

	describe('test GET /script', function () {
		it('should return 200 body with valid params', async () => {
			const options = {
				method: 'get',
				url: 'http://localhost:3000/script',
				qs: {
					_id: '5b14f6fb63b20c41b8f3c5e3'
				},
				json: true,
				resolveWithFullResponse: true,
			}
			const rs = await rp(options)
			expect(rs).not.to.be.null
			expect(rs).have.property('statusCode').eql(200)
			expect(rs).have.property('message').eql('Get script successfully')
			expect(rs).have.property('data')
			expect(rs.data).not.to.be.empty
			expect(rs.data).have.property('id')
			expect(rs.data).have.property('owner_id')
			expect(rs.data).have.property('name')
		})

		it('should return 404 body with nonexistent script id', async () => {
			const options = {
				method: 'get',
				url: 'http://localhost:3000/script',
				qs: {
					_id: '5b2a0ae2bc13cb5608fef003' // nonexistent script id
				},
				json: true,
				resolveWithFullResponse: true,
			}
			const rs = await rp(options)
			expect(rs).not.to.be.null
			expect(rs).have.property('statusCode').eql(404)
			expect(rs).have.property('message').eql('Not Found')
			expect(rs).have.property('data')
			expect(rs.data).to.be.empty
		})

		it('should return 400 body with invalid request params', async () => {
			const options = {
				method: 'get',
				url: 'http://localhost:3000/script',
				qs: {
					_id: '5b14f6fb63b20c41b8f3c5e3',
					name: '666' // redundant param
				},
				json: true,
				resolveWithFullResponse: true,
			}
			const rs = await rp(options)
			expect(rs).to.not.be.null
			expect(rs).have.property('statusCode').eql(400)
			expect(rs).have.property('message').eql('Invalid params, please input specified params')
			expect(rs).have.property('data')
			expect(rs.data).to.be.empty
		})
	})

	describe('test GET /script/params', function () {
		it('should return 200 body with valid params', async () => {
			const options = {
				method: 'get',
				url: 'http://localhost:3000/script/params',
				qs: {
					_id: '5b14f6fb63b20c41b8f3c5e3'
				},
				json: true,
				resolveWithFullResponse: true,
			}
			const rs = await rp(options)
			expect(rs).not.to.be.null
			expect(rs).have.property('statusCode').eql(200)
			expect(rs).have.property('message').eql('Get script params successfully')
			expect(rs).have.property('data')
			expect(rs.data).not.to.be.empty
			expect(rs.data).have.property('common_param')
			expect(rs.data).have.property('special_param')
		})

		it('should return 404 body with nonexistent script id', async () => {
			const options = {
				method: 'get',
				url: 'http://localhost:3000/script/params',
				qs: {
					_id: '5b2a0ae2bc13cb5608fef003' // nonexistent script id
				},
				json: true,
				resolveWithFullResponse: true,
			}
			const rs = await rp(options)
			expect(rs).not.to.be.null
			expect(rs).have.property('statusCode').eql(404)
			expect(rs).have.property('message').eql('This script not exists')
			expect(rs).have.property('data')
			expect(rs.data).to.be.empty
		})

		it('should return 400 body with invalid request params', async () => {
			const options = {
				method: 'get',
				url: 'http://localhost:3000/script/params',
				qs: {
					_id: '5b14f6fb63b20c41b8f3c5e3',
					name: '666' // redundant param
				},
				json: true,
				resolveWithFullResponse: true,
			}
			const rs = await rp(options)
			expect(rs).to.not.be.null
			expect(rs).have.property('statusCode').eql(400)
			expect(rs).have.property('message').eql('Invalid params, please input specified params')
			expect(rs).have.property('data')
			expect(rs.data).to.be.empty
		})
	})

	describe('test POST /task', function () {
		it('should return 200 body with valid params', async () => {
			const options = {
				method: 'post',
				url: 'http://localhost:3000/task',
				body: {
					script_id: '5b14f6f063b20c41b8f3c5e2',
					owner_id: '5566',
					name: 'test_task',
					time: Date.now(),
					params: {
						speed: 120,
						typeValue: 2,
						notificationValue: 0,
						alertValue: 3
					}
				},
				json: true,
				resolveWithFullResponse: true,
			}
			const rs = await rp(options)
			expect(rs).not.to.be.null
			expect(rs).have.property('statusCode').eql(200)
			expect(rs).have.property('message').eql('Inserted data successfully')
			expect(rs).have.property('data')
			expect(rs.data).not.to.be.empty
		})

		it('should return 404 body with nonexistent script id', async () => {
			const options = {
				method: 'post',
				url: 'http://localhost:3000/task',
				body: {
					script_id: '5b2a0ae2bc13cb5608fef003', // here
					owner_id: '5566',
					name: 'test_task',
					time: Date.now(),
					params: {
						typeValue: 2,
						notificationValue: 0,
						alertValue: 3
					}
				},
				json: true,
				resolveWithFullResponse: true,
			}
			const rs = await rp(options)
			expect(rs).not.to.be.null
			expect(rs).have.property('statusCode').eql(404)
			expect(rs).have.property('message').eql('Unable to find this script')
			expect(rs).have.property('data')
			expect(rs.data).to.be.empty
		})

		it('should return 400 body with invalid request params', async () => {
			const options = {
				method: 'post',
				url: 'http://localhost:3000/task',
				body: {
					script_id: '5b14f6f063b20c41b8f3c5e2',
					// lack owner_id
					name: 'test_task',
					params: {
						typeValue: 2,
						notificationValue: 0,
						alertValue: 3
					}
				},
				json: true,
				resolveWithFullResponse: true,
			}
			const rs = await rp(options)
			expect(rs).to.not.be.null
			expect(rs).have.property('statusCode').eql(400)
			expect(rs).have.property('message').eql('Invalid params, please input specified params')
			expect(rs).have.property('data')
			expect(rs.data).to.be.empty
		})

		it('should return 400 body with invalid params type', async () => {
			const options = {
				method: 'post',
				url: 'http://localhost:3000/task',
				body: {
					script_id: '5b14f6f063b20c41b8f3c5e2',
					owner_id: 5566, // should be string
					name: 'test_task',
					time: Date.now(),
					params: {
						typeValue: 2,
						notificationValue: 0,
						alertValue: 3
					}
				},
				json: true,
				resolveWithFullResponse: true,
			}
			const rs = await rp(options)
			expect(rs).not.to.be.null
			expect(rs).have.property('statusCode').eql(400)
			expect(rs).have.property('message').eql('Invalid request schema')
			expect(rs).have.property('data')
			expect(rs.data).to.be.empty
		})
	})

	describe('test PUT /task', function () {
		it('should return 200 body with valid params', async () => {
			const options = {
				method: 'put',
				url: 'http://localhost:3000/task',
				body: {
					id: '5b334b23c896b31938c1c3ac',
					script_id: '5b14f6fb63b20c41b8f3c5e3',
					owner_id: '5566',
					name: 'update_test', // update name
					time: Date.now(),
					params: {
						periodValue: 1,
						formatValue: 0
					}
				},
				json: true,
				resolveWithFullResponse: true,
			}
			const rs = await rp(options)
			expect(rs).not.to.be.null
			expect(rs).have.property('statusCode').eql(200)
			expect(rs).have.property('message').eql('Updated data successfully')
			expect(rs).have.property('data')
			expect(rs.data).not.to.be.empty
			expect(rs.data).to.have.length.above(8, 'data_length')
		})

		it('should return 404 body with nonexistent script id', async () => {
			const options = {
				method: 'put',
				url: 'http://localhost:3000/task',
				body: {
					id: '5b334b23c896b31938c1c3ac',
					script_id: '5b2a0ae2bc13cb5608fef003', // here
					owner_id: '5566',
					name: 'test_task',
					time: Date.now(),
					params: {
						periodValue: 1,
						formatValue: 0
					}
				},
				json: true,
				resolveWithFullResponse: true,
			}
			const rs = await rp(options)
			expect(rs).not.to.be.null
			expect(rs).have.property('statusCode').eql(404)
			expect(rs).have.property('message').eql('Unable to find this script')
			expect(rs).have.property('data')
			expect(rs.data).to.be.empty
		})

		it('should return 400 body with invalid request params', async () => {
			const options = {
				method: 'put',
				url: 'http://localhost:3000/task',
				body: {
					id: '5b334b23c896b31938c1c3ac',
					script_id: '5b14f6fb63b20c41b8f3c5e3',
					// lack owner_id
					name: 'test_task',
					params: {
						periodValue: 1,
						formatValue: 0
					}
				},
				json: true,
				resolveWithFullResponse: true,
			}
			const rs = await rp(options)
			expect(rs).to.not.be.null
			expect(rs).have.property('statusCode').eql(400)
			expect(rs).have.property('message').eql('Invalid params, please input specified params')
			expect(rs).have.property('data')
			expect(rs.data).to.be.empty
		})

		it('should return 400 body with invalid params type', async () => {
			const options = {
				method: 'put',
				url: 'http://localhost:3000/task',
				body: {
					id: '5b334b23c896b31938c1c3ac',
					script_id: '5b14f6fb63b20c41b8f3c5e3',
					owner_id: 5566, // should be string
					name: 'test_task',
					params: {
						periodValue: 1,
						formatValue: 0
					}
				},
				json: true,
				resolveWithFullResponse: true,
			}
			const rs = await rp(options)
			expect(rs).to.not.be.null
			expect(rs).have.property('statusCode').eql(400)
			expect(rs).have.property('message').eql('Invalid request schema')
			expect(rs).have.property('data')
			expect(rs.data).to.be.empty
		})

		it('should return 404 body with nonexistent task id', async () => {
			const options = {
				method: 'put',
				url: 'http://localhost:3000/task',
				body: {
					id: '5b334b23c896b31938c16666', // nonexistent task id
					script_id: '5b14f6f063b20c41b8f3c5e2',
					owner_id: '5566',
					name: 'test_task',
					time: Date.now(),
					params: {
						periodValue: 1,
						formatValue: 0
					}
				},
				json: true,
				resolveWithFullResponse: true,
			}
			const rs = await rp(options)
			expect(rs).not.to.be.null
			expect(rs).have.property('statusCode').eql(404)
			expect(rs).have.property('message').eql('Unable to find this task')
			expect(rs).have.property('data')
			expect(rs.data).to.be.empty
		})
	})

	describe('test GET /result', function () {
		it('should return 200 body with valid params', async () => {
			const options = {
				method: 'get',
				url: 'http://localhost:3000/result',
				query: this.ctx.query.id,
				json: true,
				resolveWithFullResponse: true,
			}
			const rs = await rp(options)
			expect(rs).not.to.be.null
			expect(rs).have.property('statusCode').eql(200)
			expect(rs).have.property('message').eql('Get result successfully')
			expect(rs).have.property('data')
			expect(rs.data).not.to.be.empty
			expect(rs.data).to.have.length.above(5, 'data.length')
		})

		it('should return 404 body with nonexistent script id', async () => {
			const options = {
				method: 'put',
				url: 'http://localhost:3000/task',
				body: {
					id: '5b334b23c896b31938c1c3ac',
					script_id: '5b2a0ae2bc13cb5608fef003', // here
					owner_id: '5566',
					name: 'test_task',
					time: Date.now(),
					params: {
						periodValue: 1,
						formatValue: 0
					}
				},
				json: true,
				resolveWithFullResponse: true,
			}
			const rs = await rp(options)
			expect(rs).not.to.be.null
			expect(rs).have.property('statusCode').eql(404)
			expect(rs).have.property('message').eql('Unable to find this script')
			expect(rs).have.property('data')
			expect(rs.data).to.be.empty
		})

		it('should return 400 body with invalid request params', async () => {
			const options = {
				method: 'put',
				url: 'http://localhost:3000/task',
				body: {
					id: '5b334b23c896b31938c1c3ac',
					script_id: '5b14f6fb63b20c41b8f3c5e3',
					// lack owner_id
					name: 'test_task',
					params: {
						periodValue: 1,
						formatValue: 0
					}
				},
				json: true,
				resolveWithFullResponse: true,
			}
			const rs = await rp(options)
			expect(rs).to.not.be.null
			expect(rs).have.property('statusCode').eql(400)
			expect(rs).have.property('message').eql('Invalid params, please input specified params')
			expect(rs).have.property('data')
			expect(rs.data).to.be.empty
		})

		it('should return 400 body with invalid params type', async () => {
			const options = {
				method: 'put',
				url: 'http://localhost:3000/task',
				body: {
					id: '5b334b23c896b31938c1c3ac',
					script_id: '5b14f6fb63b20c41b8f3c5e3',
					owner_id: 5566, // should be string
					name: 'test_task',
					params: {
						periodValue: 1,
						formatValue: 0
					}
				},
				json: true,
				resolveWithFullResponse: true,
			}
			const rs = await rp(options)
			expect(rs).to.not.be.null
			expect(rs).have.property('statusCode').eql(400)
			expect(rs).have.property('message').eql('Invalid request schema')
			expect(rs).have.property('data')
			expect(rs.data).to.be.empty
		})

		it('should return 404 body with nonexistent task id', async () => {
			const options = {
				method: 'put',
				url: 'http://localhost:3000/task',
				body: {
					id: '5b334b23c896b31938c16666', // nonexistent task id
					script_id: '5b14f6f063b20c41b8f3c5e2',
					owner_id: '5566',
					name: 'test_task',
					time: Date.now(),
					params: {
						periodValue: 1,
						formatValue: 0
					}
				},
				json: true,
				resolveWithFullResponse: true,
			}
			const rs = await rp(options)
			expect(rs).not.to.be.null
			expect(rs).have.property('statusCode').eql(404)
			expect(rs).have.property('message').eql('Unable to find this task')
			expect(rs).have.property('data')
			expect(rs.data).to.be.empty
		})
	})
})
