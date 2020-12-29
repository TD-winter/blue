//app.js
const apiConfig = require('./utils/url.js');
App({
  onLaunch: function () {
    // 展示本地存储能力
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
        let that = this;
        let url = apiConfig.api.getOpenId;
        wx.request({
          method: 'GET',
          url: url,
          data: {code: res.code},
          header: {
            'Content-Type': 'application/x-www-form-urlencoded', // 默认值
          },
          success: res => {
            wx.setStorage({
              key: "openId",
              data: res.data.openid
            })
          },
          complete: res => {
            console.log(res)
          }
        })
      }
    })
    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              // 可以将 res 发送给后台解码出 unionId
              this.globalData.userInfo = res.userInfo
              // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
              // 所以此处加入 callback 以防止这种情况
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res)
              }
            }
          })
        }
      }
    })
  },
  pay: function (money, fn) {
    let openId = wx.getStorageSync('openId');
    let data = {
      openid: openId,
      money: money
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
          'success': (res) => {
            if ( typeof(fn) == 'function' ) {
              fn();
            }
            this.addPayHistoryList(data.body, money, this.globalData.userInfo.nickName, openId);
            console.log("支付成功", res)
          },
          'fail': function (res) { },
          'complete': function (res) { }
        })
      }
    })
  },
  addPayHistoryList(title, money, user, openId) {
    let data = {
      title: title,
      money: money,
      user: user,
      openId: openId,
    }
    wx.request({
      url: apiConfig.api.addPayHistoryList,
      data: data,
      method: "POST",
      dataType: "json",
      success: (res) => {
        console.log(res)
      }
    })
  },
  globalData: {
    userInfo: null
  }
})