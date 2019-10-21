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
    db.collection('teams').doc(event.team_id)
      .remove()
      .then(res => {
        resolve({
          code: 1000,
          data: {},
          message: '解散队伍成功'
        })
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