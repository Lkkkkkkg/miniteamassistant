const cloud = require('wx-server-sdk');
cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: cloud.DYNAMIC_CURRENT_ENV
})
exports.main = async(event, context) => {
  const wxContext = cloud.getWXContext()
  return new Promise((resolve, reject) => {
    const db = cloud.database();
    db.collection('users')
      .where({
        _openid: wxContext.OPENID
      })
      .get()
      .then(res => {
        if (res.data.length === 0) { //未注册 
          const newUser = {
            ...event.userInfo,
            ...{
              teams: []
            }
          }
          //注册新用户
          db.collection('users')
            .add({
              data: newUser
            })
            .then(res1 => {
              resolve({
                code: 1000,
                data: {
                  userInfo: {
                    ...{
                      _id: res1._id
                    },
                    ...newUser
                  }
                },
                message: '登陆成功'
              })
            })
            .catch(err => {
              reject({
                code: 2000,
                data: {},
                message: err.message
              })
            })
        }else { //已注册
          resolve({
            code: 1000,
            data: {
              userInfo: res.data[0]
            },
            message: '登陆成功'
          })
        }
      })
      .catch(err => {
        reject({
          code: 2000,
          data: {},
          message: err.message
        })
      })
  })
}