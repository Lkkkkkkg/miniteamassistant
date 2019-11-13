const cloud = require('wx-server-sdk');
cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: cloud.DYNAMIC_CURRENT_ENV
})
exports.main = async(event, context) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database();
  try {
    const res = await cloud.openapi.security.msgSecCheck({
      content: event.data.teamName + event.data.remarks
    })
    //内容无违规
    return new Promise((resolve, reject) => {
      console.log(wxContext.OPENID)
      db.collection('users')
        .where({
          _openid: wxContext.OPENID
        })
        .get()
        .then(res => {
          if (res.data[0].teams.length === 0) { //当前无队伍
            db.collection('teams').add({
              data: event.data
            })
              .then(res2 => {
                db.collection('users').doc(event.data.creator._id).update({
                  data: {
                    teams: db.command.push(res2._id)
                  }
                }).then(res3 => {
                  resolve({
                    code: 1000,
                    data: res2,
                    message: '发起组队成功'
                  })
                })
                  .catch(err3 => {
                    resolve({
                      code: 2000,
                      data: { err3 },
                      message: '更新记录失败'
                    })
                  })
              })
              .catch(err2 => {
                console.log(err2)
                resolve({
                  code: 2000,
                  data: err2,
                  message: '添加记录失败'
                })
              })
          }else {
            db.collection('teams')
              .where({
                _id: res.data[0].teams[res.data[0].teams.length - 1]
              })
              .get()
              .then(res1 => {
                if (res1.data.length > 0 && event.data.startTime <= res1.data[0].endTime) { //判断是否已有队伍
                  resolve({
                    code: 1001,
                    data: {},
                    message: '该活动时段内你已经加入了一个队伍'
                  })
                } else {
                  db.collection('teams').add({
                    data: event.data
                  })
                    .then(res2 => {
                      db.collection('users').doc(event.data.creator._id).update({
                        data: {
                          teams: db.command.push(res2._id)
                        }
                      }).then(res3 => {
                        resolve({
                          code: 1000,
                          data: res2,
                          message: '发起组队成功'
                        })
                      })
                        .catch(err3 => {
                          resolve({
                            code: 2000,
                            data: { err3 },
                            message: '更新记录失败'
                          })
                        })
                    })
                    .catch(err2 => {
                      console.log(err2)
                      resolve({
                        code: 2000,
                        data: err2,
                        message: '添加记录失败'
                      })
                    })
                }
              })
          }
    
        })
        .catch(err1 => {
          console.log(err1)
          resolve({
            code: 2000,
            data: {},
            message: '查询记录失败'
          })
        })
    })
  } catch (err) {
    return {
      code: 1002,
      data: {},
      message: '队伍名字或活动要求含违规内容'
    }
  }
}