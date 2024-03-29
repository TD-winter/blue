//index.js
//获取应用实例
const apiConfig = require('../../utils/url.js');
const app = getApp()

Page({
  data: {
    motto: 'Hello World',
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo')
  },
  onLoad: function () {
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse){
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }
  },
  getUserInfo: function(e) {
    console.log(e)
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  },
  pay: function () {
    let openId = wx.getStorageSync('openId');
    let data = {
      openid: openId,
      money: 0.01
    }
    wx.request({
      url: apiConfig.api.pay,
      data: data,
      method: "POST",
      dataType: "json",
      success: (res) => {
        let data = res.data.data
        wx.requestPayment({
          "timeStamp": data.timeStamp,
          "package": "prepay_id=" + data.prepayId,
          "nonceStr": data.nonceStr,
          "signType": "MD5",
          "paySign": data.paySign,
          'success': function (res) {
            console.log("支付成功", res)
          },
          'fail': function (res) { },
          'complete': function (res) { }
        })
      }
    })
  },
  //事件处理函数
  bindViewTap: function () {
    wx.navigateTo({
      url: '../logs/logs'
    })
  }
})
