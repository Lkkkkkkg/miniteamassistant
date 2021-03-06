const cloud = require('wx-server-sdk');
cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: cloud.DYNAMIC_CURRENT_ENV
});
const formateTime = (time) => {
  const date = new Date(time);
  let year = date.getFullYear(),
    month = date.getMonth() + 1,
    day = date.getDate(),
    hour = date.getHours(),
    min = date.getMinutes();
  month = month < 10 ? '0' + month : month;
  day = day < 10 ? '0' + day : day;
  hour = hour < 10 ? '0' + hour : hour;
  min = min < 10 ? '0' + min : min;

  return `${year}-${month}-${day} ${hour}:${min}`
}
const joinTeam = (event, teamItem, resolve, reject) => {
  const db = cloud.database();
  const p1 = db.collection('teams').doc(event.team_id).update({
    data: {
      participant: db.command.push(event.userInfo._id),
      currentNum: db.command.inc(1)
    }
  });
  //用户添加参与队伍
  const p2 = db.collection('users').doc(event.userInfo._id).update({
    data: {
      teams: db.command.push(event.team_id)
    }
  });

  Promise.all([p1, p2]).then((res1, res2) => {
      // teamItem.participant.push(event.userInfo);
      // if (teamItem.participant.length === teamItem.maxNum) {
      //   teamItem.participant.forEach(userInfo => {
      //     console.log(userInfo._openid)
      //     //发送模板消息
      //     cloud.openapi.templateMessage.send({
      //       touser: userInfo._openid,
      //       templateId: 'uX2BPyE1ljnsm762B0kIhs-3ULK19SL28YbykNzT0lw',
      //       formId: event.formId,
      //       page: 'pages/index/index',
      //       data: {
      //         keyword1: {
      //           value: teamItem.teamName,
      //         },
      //         keyword2: {
      //           value: teamItem.participant[0].nickName,
      //         },
      //         keyword3: {
      //           value: teamItem.activity.activityName,
      //         },
      //         keyword4: {
      //           value: `${formateTime(teamItem.startTime)} 至\n${formateTime(teamItem.endTime)}`,
      //         },
      //         keyword5: {
      //           value: teamItem.maxNum,
      //         },
      //         keyword6: {
      //           value: teamItem.remarks,
      //         },
      //       }
      //     })
      //   })
      // }
      resolve({
        code: 1000,
        data: {},
        message: '加入队伍成功'
      })
    })
    .catch((err1, err2, err3) => {
      reject({
        code: 2000,
        data: {},
        message: err1 || err2
      })
    })
}
exports.main = async(event, context) => {
  // 获取 WX Context (微信调用上下文)，包括 OPENID、APPID、及 UNIONID（需满足 UNIONID 获取条件）
  const wxContext = cloud.getWXContext()
  return new Promise((resolve, reject) => {
    const db = cloud.database();
    db.collection('users')
      .where({
        _openid: wxContext.OPENID
      })
      .get()
      .then(res => {
        const p1 = db.collection('teams')
          .where({
            _id: event.team_id
          })
          .get();
        const p2 = db.collection('teams')
          .where({
            _id: res.data[0].teams[res.data[0].teams.length - 1] ? res.data[0].teams[res.data[0].teams.length - 1] : ''
          })
          .get()
        Promise.all([p1,p2]).then((res1)=>{
          if (res1[0].data.length === 0) {
            resolve({
              code: 1001,
              data: {},
              message: '队伍已解散'
            })
          } else if (new Date().getTime() > res1[0].data[0].endTime) { //判断活动是否过期
            resolve({
              code: 1002,
              data: {},
              message: '活动已结束'
            })
          } else if (res1[0].data[0].participant.length === res1[0].data[0].maxNum) { //判断队伍是否已满
            resolve({
              code: 1003,
              data: {},
              message: '队伍已满'
            })
          }else if (res1[1].data.length > 0 && res1[0].data[0].startTime <= res1[1].data[0].endTime) { //判断是否已有队伍
            resolve({
              code: 1005,
              data: {},
              message: '该活动时段内你已经加入了一个队伍'
            })
          }else {
            joinTeam({
              team_id: event.team_id,
              userInfo: res.data[0],
            }, res1[0].data[0], resolve, reject)
          }
        })
      })
  })
}