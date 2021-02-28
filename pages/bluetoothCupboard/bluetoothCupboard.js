// pages/bluetoothCupboard/bluetoothCupboard.js
const app = getApp();
var backgroundAudioManager = null;
Page({
  /**
   * 页面的初始数据
   */
  data: {
    bgImgArr: ['/source/img/img1.jpg', '/source/img/img2.gif', '/source/img/img3.jpg'],
    bgImg: '/source/img/img1.jpg',
    downNumber: 42,
    userInfo: {},
    hasUserInfo: false,
    step: 1, // 表示进入到第几步，状态
    deviceId: '98:DA:A0:00:06:E9',
    deviceName: null,
    serviceIdArray: [],
    characteristicIdArray: [],
    readServiceId: null,
    writeServiceId: null,
    notifyServiceId: null,
    readUuid: null,
    writeUuid: null,
    notifyUuid: null,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    getBlueData: '',
    sendData: 3,
    isShowAgreement: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    if ( options.deviceName ) {
      this.setData({
        deviceName: options.deviceName
      })
    }
    let q = decodeURIComponent(options.q);
    if ( q && q.split('deviceName=')[1] ) {
      this.setData({
        deviceName: q.split('deviceName=')[1]
      })
    }
    if (app.globalData.userInfo) {
      this.setData({
        // userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse){
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        this.setData({
          // userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            // userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    if ( this.data.deviceName ) {
      this.initBluetooth();
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    this.closeBluetooth()
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },
  initBluetooth() {
    let that = this;
    wx.showLoading({
      title: '蓝牙初始化中',
    });
    wx.openBluetoothAdapter({
      success: function (res) {
        console.log('初始化蓝牙适配器成功' + JSON.stringify(res))
        wx.startBluetoothDevicesDiscovery({
          success (res) {
            console.log(res)
            wx.onBluetoothDeviceFound(function(list) {
              console.log(list)
              var devices = list.devices;
              for ( let i = 0, len = devices.length; i < len; i++ ) {
                if ( devices[i].name.indexOf(that.data.deviceName) > -1 ) {
                  that.data.deviceId = devices[i].deviceId;
                  that.connectBlue(that.data.deviceId);
                  wx.offBluetoothDeviceFound(_ => {})
                  wx.stopBluetoothDevicesDiscovery({
                    success(res) {
                      console.log(res)
                    }
                  });
                }
              }
            })
          },
          complete(res) {
            console.log(res)
          }
        })
      },
      fail: function () {
        wx.hideLoading();
        that.msg = '初始化蓝牙适配器失败'
        wx.showModal({
          title: '蓝牙适配情况',
          content: '蓝牙适配失败，请检查手机蓝牙和定位功能是否打开'
        })
      },
      complete: function () {
        console.log('初始化蓝牙适配器完成')
      }
    })
  },
  connectBlue(deviceId) {
    let that = this;
    let jLen = 0, kLen = 0;
    let serviceId = '';
    wx.createBLEConnection({
      deviceId: deviceId,
      success (res) {
        console.log(res)
        wx.getBLEDeviceServices({
          // 这里的 deviceId 需要已经通过 createBLEConnection 与对应设备建立链接
          deviceId,
          success (services) {
            that.data.serviceIdArray = services.services;
            for ( let j = 0, len = services.services.length; j < len; j++ ) {
              wx.getBLEDeviceCharacteristics({
                // 这里的 deviceId 需要已经通过 createBLEConnection 与对应设备建立链接
                deviceId,
                // 这里的 serviceId 需要在 getBLEDeviceServices 接口中获取
                serviceId: services.services[j].uuid,
                success (res) {
                  jLen = j;
                  for ( let k = 0, pLen = res.characteristics.length; k < pLen; k++ ) {
                    kLen = k;
                    if ( (res.characteristics[k].properties.indicate
                      || res.characteristics[k].properties.notify) && !that.data.notifyUuid ) {
                      that.data.notifyServiceId = services.services[j].uuid;
                      // that.data.notifyUuid = res.characteristics[k].uuid;
                      that.setData({
                        notifyUuid: res.characteristics[k].uuid
                      })
                    }

                    if ( res.characteristics[k].properties.read && !that.data.readUuid ) {
                      that.data.readServiceId = services.services[j].uuid;
                      // that.data.readUuid = res.characteristics[k].uuid;
                      that.setData({
                        readUuid: res.characteristics[k].uuid
                      })
                    }

                    if ( res.characteristics[k].properties.write && !that.data.writeUuid ) {
                      that.data.writeServiceId = services.services[j].uuid;
                      // that.data.writeUuid = res.characteristics[k].uuid;
                      that.setData({
                        writeUuid: res.characteristics[k].uuid
                      })
                    }
                  }

                  if ( jLen == services.services.length-1
                      && kLen == res.characteristics.length-1 ) {
                    wx.notifyBLECharacteristicValueChange({
                      state: true,
                      deviceId,
                      serviceId: that.data.notifyServiceId,
                      characteristicId: that.data.notifyUuid,
                      success (res) {
                        console.log('notifyBLECharacteristicValueChange success', res.errMsg)
                        wx.onBLECharacteristicValueChange(function(characteristic) {
                          console.log(that.ab2str(characteristic.value))
                          that.setData({
                            getBlueData: that.data.getBlueData + that.ab2str(characteristic.value)
                          })
                        })
                      }
                    })
                  }
                }
              })
            }
          },
          complete(res) {
            wx.hideLoading();
            console.log(res)
          }
        })
      }
    })
  },
  pay(event) {
    app.pay(0.01, this.setDataToBlue);
    // this.setDataToBlue(event)
  },
  // 8位，大端存储，0关，1开
  setDataToBlue(event) {
    var that = this;
    let data = null;
    if ( event && event.currentTarget.dataset.senddata ) {
      data = event.currentTarget.dataset.senddata;
    }

    // let buffer = new ArrayBuffer(8)
    // let dataView = new DataView(buffer)
    // dataView.setUint8(0, this.data.sendData);

    let bufferData = new Uint8Array([221, 0, this.data.sendData])

    wx.writeBLECharacteristicValue({
      deviceId: that.data.deviceId,
      serviceId: that.data.writeServiceId,
      characteristicId: that.data.writeUuid,
      value: bufferData.buffer,
      success (res) {
        console.log('writeBLECharacteristicValue success', res);
        that.setData({
          bgImg: that.data.bgImgArr[1],
          step: 2
        });
        that.createVoice();
        that.shutDownNumber();
      }
    })
  },
  bindKeyInput(e) {
    this.data.sendData = e.detail.value || 3;
  },
  ab2str(buffer) {
    return String.fromCharCode.apply(null, new Uint8Array(buffer));
  },
  closeBluetooth() {
    wx.closeBLEConnection({
      deviceId: this.data.deviceId,
      success (res) {
        console.log(res)
      }
    });
    wx.closeBluetoothAdapter({
      success (res) {
        console.log(res)
      }
    })
  },
  initBluetoothAgain() {
    this.initBluetooth();
  },
  scanQrCode(){
    let that = this;
    wx.scanCode({
      onlyFromCamera: true,
      scanType: ['qrCode'],
      success (res) {
        console.log(res)
        if (res.result && res.result.split('deviceName=')[1]) {
          that.setData({
            deviceName: res.result.split('deviceName=')[1]
          })
          that.initBluetooth();
        }
      }
    })
  },
  getUserInfo: function(e) {
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      // userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  },
  shutDownNumber: function(){
    var that = this;
    var downFn = setInterval(function(){
      that.setData({
        downNumber: --that.data.downNumber
      })
      if ( that.data.downNumber == 0 ) {
        that.setData({
          step: 3
        })
        clearInterval(downFn)
        backgroundAudioManager.src = '/source/voice/02.wav';
      }
    }, 1000)
  },
  createVoice: function(){
    backgroundAudioManager = wx.getBackgroundAudioManager()
    backgroundAudioManager.title = '消毒柜消毒中...'
    // 设置了 src 之后会自动播放
    backgroundAudioManager.src = 'https://winter-voice.oss-cn-hangzhou.aliyuncs.com/mp3/01.wav'
  },
  showAgreement(){
    this.setData({
      isShowAgreement: true
    })
  },
  hideAgreement(){
    this.setData({
      isShowAgreement: false
    })
  }
})