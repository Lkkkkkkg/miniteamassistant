const cloud = require('wx-server-sdk');
cloud.init()
exports.main = async(event, context) => {

  // 获取 WX Context (微信调用上下文)，包括 OPENID、APPID、及 UNIONID（需满足 UNIONID 获取条件）
  const wxContext = cloud.getWXContext()
  return new Promise((resolve, reject) => {
    const db = cloud.database();
    console.log(event)
    db.collection('teams').doc(event._id).update({
        // data 传入需要局部更新的数据
        data: {
          participant: db.command.push(event.user_id)
        }
      })
      .then(res => {
        resolve(res)
      })
      .catch(err => {
        reject(err)
      })
  })
}