const cloud = require('wx-server-sdk');
cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: cloud.DYNAMIC_CURRENT_ENV
});

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
        if (res.data.length === 0) {
          resolve({
            code: 1001,
            data: {},
            message: '队伍已解散'
          })
        } else if (new Date().getTime() > res.data[0].endTime) { //判断活动是否过期
          resolve({
            code: 1002,
            data: {},
            message: '活动已结束'
          })
        } else {
          console.log(res.data[0], event.userInfo)
          //队伍表里删除当前用户
          const findParticipantIndex = res.data[0].participant.findIndex(item => item === event.userInfo._id)
          if (findParticipantIndex === -1) {
            resolve({
              code: 1003,
              data: {},
              message: '你不在此队伍中'
            })
          } else {
            res.data[0].participant.splice(findParticipantIndex, 1);
            const p1 = db.collection('teams').doc(event.team_id).update({
              data: {
                participant: res.data[0].participant
              }
            });
            //用户表退出该队伍
            const p2 = db.collection('users').doc(event.userInfo._id).update({
              data: {
                teams: db.command.pop()
              }
            });
            Promise.all([p1, p2]).then((res2, res3) => {
                resolve({
                  code: 1000,
                  data: {},
                  message: '退出队伍成功'
                })
              })
              .catch((err2, err3) => {
                reject({
                  code: 2000,
                  data: {},
                  message: err2 || err3
                })
              })
          }
        }
      })
      .catch(err => {
        console.log(err)
        reject({
          code: 2000,
          data: {},
          message: err
        })
      })
  })
}