const app = getApp();
const db = wx.cloud.database();
const date = new Date();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo: null,
    teamName: '',
    activityLoading: true,
    activityTypePickerShow: false,
    activityTypeList: null,
    activityTypeValue: [0],
    activityType: null,
    maxNumPickerShow: false,
    maxNumLoading: false,
    maxNumList: null,
    maxNumValue: [0],
    maxNum: null,
    startTimePickerShow: false,
    endTimePickerShow: false,
    days: ['今天', '明天', '后天'],
    hours: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
    mins: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59],
    startTimeValue: [0, date.getHours(), date.getMinutes()],
    endTimeValue: [0, date.getHours(), date.getMinutes()],
    duration: null,
    remarks: '',
    activity: null,
    submiting: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    this.setData({
      userInfo: app.globalData.userInfo
    })
    this.getActivity();
  },
  getActivity() {
    db.collection('activities')
      .get()
      .then(res => {
        const activityTypeList = res.data.map(item => {
          return item.activityName
        })
        this.setData({
          activityLoading: false,
          activityTypeList
        })
      })
      .catch(err => {
        wx.showToast({
          icon: 'none',
          title: '查询记录失败'
        });
      })
  },
  handleTeamNameInput(e) {
    this.setData({
      teamName: e.detail.value
    })
  },
  handleRemarksInput(e) {
    this.setData({
      remarks: e.detail.value
    })
  },
  showActivityTypePicker() {
    this.setData({
      activityTypePickerShow: true
    })
  },
  closeActivityTypePicker() {
    this.setData({
      activityTypePickerShow: false
    })
  },
  pickerStart() {
    this.pickerChanging = true;
  },
  pickerEnd() {
    this.pickerChanging = false;
  },
  bindActivityTypeChange(e) {
    this.setData({
      activityTypeValue: e.detail.value
    })
  },
  confirmActivityType() {
    if (this.pickerChanging) return;
    this.setData({
      activityTypePickerShow: false
    });
    if (this.data.activityType !== this.data.activityTypeList[this.data.activityTypeValue[0]]) {
      this.setData({
        activityType: this.data.activityTypeList[this.data.activityTypeValue[0]],
        maxNumLoading: true
      })
      db.collection('activities')
        .where({
          activityType: this.data.activityTypeValue[0]
        })
        .get()
        .then(res => {
          const maxNumList = Array.from({
            length: res.data[0].maxNum - 1
          }).map((item, index) => {
            return index + 2;
          });
          this.setData({
            maxNumList,
            maxNumLoading: false,
            activity: res.data[0]
          })
        })
    }
  },
  showMaxNumPicker() {
    if (!this.data.activityType || this.data.maxNumLoading) return;
    this.setData({
      maxNumPickerShow: true
    })
  },
  closeMaxNumPicker() {
    this.setData({
      maxNumPickerShow: false
    })
  },
  bindMaxNumChange(e) {
    this.setData({
      maxNumValue: e.detail.value
    })
  },
  confirmMaxNum() {
    if (this.pickerChanging) return;
    this.setData({
      maxNumPickerShow: false,
      maxNum: this.data.maxNumList[this.data.maxNumValue[0]]
    })
  },
  bindStartTimeChange(e) {
    this.setData({
      startTimeValue: e.detail.value
    })
  },
  bindEndTimeChange(e) {
    this.setData({
      endTimeValue: e.detail.value
    })
  },
  showStartTimePicker() {
    this.setData({
      startTimePickerShow: true
    })
  },
  closeStartTimePicker() {
    this.setData({
      startTimePickerShow: false
    })
  },
  handleClickNext() {
    if (this.pickerChanging) return;
    const isOverEndTime = (this.data.startTimeValue[0] * 1440 + this.data.startTimeValue[1] * 60 + this.data.startTimeValue[2]) >= (this.data.endTimeValue[0] * 1440 + this.data.endTimeValue[1] * 60 + this.data.endTimeValue[2]);
    this.setData({
      endTimeValue: isOverEndTime ? this.data.startTimeValue : this.data.endTimeValue, //如果开始时间大于等于结束时间，将开始时间赋值给结束时间
      startTimePickerShow: false,
      endTimePickerShow: true
    })
  },
  handleClickBack() {
    const isOverStartTime = (this.data.endTimeValue[0] * 1440 + this.data.endTimeValue[1] * 60 + this.data.endTimeValue[2]) < (this.data.startTimeValue[0] * 1440 + this.data.startTimeValue[1] * 60 + this.data.startTimeValue[2]);
    this.setData({
      startTimeValue: isOverStartTime ? this.data.endTimeValue : this.data.startTimeValue, //如果结束日期，将结束日期赋值给开始日期
      startTimePickerShow: true,
      endTimePickerShow: false
    })
  },
  confirmTime() {
    if (this.pickerChanging) return;
    if ((this.data.endTimeValue[0] * 1440 + this.data.endTimeValue[1] * 60 + this.data.endTimeValue[2]) < (this.data.startTimeValue[0] * 1440 + this.data.startTimeValue[1] * 60 + this.data.startTimeValue[2])) {
      wx.showToast({
        icon: 'none',
        title: '结束时间必须大于开始时间'
      });
      return;
    }
    this.setData({
      endTimePickerShow: false,
      duration: [this.data.startTimeValue, this.data.endTimeValue]
    })
  },
  submit() {
    if (this.data.submiting || this.data.teamName === 0 || this.data.activityType === null || this.data.maxNum === null || this.data.duration === null) {
      return;
    }
    this.setData({
      submiting: true
    });
    const date = new Date();
    const participant = [];
    for (var i = 0; i < this.data.maxNum - 1; i++) {
      participant[i] = {
        player: null
      }
    }
    wx.cloud.callFunction({
        name: "addTeam",
        data: {
          data: {
            createTime: new Date().getTime(),
            teamName: this.data.teamName,
            activity: this.data.activity,
            maxNum: this.data.maxNum,
            currentNum: 1,
            startTime: new Date(date.getFullYear(), date.getMonth(), date.getDate() + this.data.duration[0][0], this.data.duration[0][1], this.data.duration[0][2], 0).getTime(),
            endTime: new Date(date.getFullYear(), date.getMonth(), date.getDate() + this.data.duration[1][0], this.data.duration[1][1], this.data.duration[1][2], 59).getTime(),
            creator: app.globalData.userInfo,
            participant,
            remarks: this.data.remarks
          }
        }
      })
      .then(res => {
        if (res.result.code === 1000) {
          console.log(res.result)
          app.globalData.userInfo.teams.push(res.result.data._id);
          wx.navigateBack({
            success() {
              wx.showToast({
                icon: 'none',
                title: res.result.message
              })
            }
          });
        } else {
          this.setData({
            submiting: false
          });
          wx.showToast({
            icon: 'none',
            title: res.result.message
          });
        }
      })
      .catch(err => {
        wx.showToast({
          icon: 'none',
          title: err.message
        })
        this.setData({
          submiting: false
        });
      })
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {

  },
})