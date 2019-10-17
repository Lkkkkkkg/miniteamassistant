const cloud = require('wx-server-sdk');
cloud.init()
exports.main = async (event, context) => {
  // 获取 WX Context (微信调用上下文)，包括 OPENID、APPID、及 UNIONID（需满足 UNIONID 获取条件）
  const wxContext = cloud.getWXContext()
  console.log(event, wxContext)
  return new Promise((resolve, reject) => {
    const db = cloud.database();
    db.collection('teams').add({
      data: {
        gameIcon: event.gameIcon,
        gameType: event.gameType,
        maxNum: event.maxNum,
        startTime: event.startTime,
        participant: [event.userInfo.openId]
      }
    })
      .then(res => {
        console.log('[数据库: teams] [添加记录] 成功：', res);
        resolve(res);
      })
      .catch(err => {
        wx.showToast({
          icon: 'none',
          title: '添加记录失败'
        })
        console.error('[数据库: teams] [添加记录] 失败：', err);
        reject(err);
      })
  })
}