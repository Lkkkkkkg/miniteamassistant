const app = getApp();
const login = (type,userInfo) => {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'login',
      data: {
        type,
        userInfo
      }
    })
      .then(res => {
        console.log(res)
        if(res.result.code === 1000) app.globalData.userInfo = res.result.data.userInfo;
        if (res.result.code === 1001) app.globalData.unRegister = true;
        resolve(res);
      })
      .catch(err => {
        wx.showToast({
          icon: 'none',
          title: err
        });
        reject(err);
      })
  })
}


module.exports = {
  login
}