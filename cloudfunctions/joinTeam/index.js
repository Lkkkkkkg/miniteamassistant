const cloud = require('wx-server-sdk');
cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: cloud.DYNAMIC_CURRENT_ENV
});
const joinTeam = (team_id, userInfo, resolve, reject) => {
  const db = cloud.database();
  const p1 = db.collection('teams').doc(team_id).update({
    data: {
      participant: db.command.push(userInfo)
    }
  });
  //用户添加参与队伍
  const p2 = db.collection('users').doc(userInfo._id).update({
    data: {
      teams: db.command.push(team_id)
    }
  });
  Promise.all([p1, p2]).then((res2, res3) => {
      resolve({
        code: 1000,
        data: {},
        message: '加入队伍成功'
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
        if (new Date().getTime() > res.data[0].endTime) { //判断活动是否过期
          resolve({
            code: 1002,
            data: {},
            message: '开黑已结束'
          })
        } else if (res.data[0].participant.length === res.data[0].maxNum) { //判断队伍是否已满
          resolve({
            code: 1003,
            data: {},
            message: '队伍已满'
          })
        } else {
          console.log(event.userInfo.teams)
          if (event.userInfo.teams.length === 0) {
            console.log(1)
            joinTeam(event.team_id, event.userInfo, resolve, reject)
          } else {
         

            db.collection('teams')
              .where({
                _id: event.userInfo.teams[event.userInfo.teams.length - 1]
              })
              .get()
              .then(res1 => { //判断用户是否已经加入一个队伍
                if (new Date().getTime() <= res1.data[0].endTime) {
                  resolve({
                    code: 1004,
                    data: {},
                    message: '你已经加入了一个队伍'
                  })
                } else {
                  joinTeam(event.team_id, event.userInfo, resolve, reject)
                }
              })
              .catch(err1 => {
                console.log(err1)
                reject({
                  code: 2000,
                  data: {},
                  message: err1
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