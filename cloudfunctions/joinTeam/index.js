const cloud = require('wx-server-sdk');
cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: cloud.DYNAMIC_CURRENT_ENV
})
exports.main = async(event, context) => {

  // 获取 WX Context (微信调用上下文)，包括 OPENID、APPID、及 UNIONID（需满足 UNIONID 获取条件）
  const wxContext = cloud.getWXContext()
  return new Promise((resolve, reject) => {
    const db = cloud.database();
    db.collection('teams')
      .where({
        _id: event.team_id
      })
      .get()
      .then(res => {
        const teamItem = res.data[0];
        if (teamItem.participant.length < teamItem.maxNum) { //小于最大人数允许加入
          const p1 = db.collection('teams').doc(event.team_id).update({
            data: {
              participant: db.command.push(event.userInfo)
            }
          });
          //用户添加参与队伍
          const p2 = db.collection('users').doc(event.userInfo._id).update({
            data: {
              teams: db.command.push(event.team_id)
            }
          });
          Promise.all([p1, p2]).then((res1, res2) => {
              resolve({
                code: 1000,
                data: {},
                message: '加入队伍成功'
              })
            })
            .catch((err1, err2) => {
              reject({
                code: 2000,
                data: {},
                message: err1.message || err2.message
              })
            })
        } else {
          resolve({
            code: 1001,
            data: {},
            message: '加入失败：队伍已满'
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