// pages/bluetoothCupboard/bluetoothCupboard.js
const app = getApp()
Page({
  /**
   * 页面的初始数据
   */
  data: {
    deviceId: '98:DA:A0:00:06:E9',
    deviceName: null,
    serviceIdArray: [],
    characteristicIdArray: [],
    readServiceId: null,
    writeServiceId: null,
    notifyServiceId: null,
    readUuid: null,
    writeUuid: null,
    notifyUuid: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let q = decodeURIComponent(options.q);
    this.deviceName = q.split('deviceName=')[1] || 'BT04-E';
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    this.initBluetooth();
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
    wx.openBluetoothAdapter({
      success: function (res) {
        console.log('初始化蓝牙适配器成功' + JSON.stringify(res))
        wx.startBluetoothDevicesDiscovery({
          success (res) {
            wx.onBluetoothDeviceFound(function(list) {
              var devices = list.devices;
              for ( let i = 0, len = devices.length; i < len; i++ ) {
                if ( devices[i].name.indexOf(that.deviceName) > -1 ) {
                  that.deviceId = devices[i].deviceId;
                  that.connectBlue(that.deviceId);
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
            that.serviceIdArray = services.services;
            for ( let j = 0, len = services.services.length; j < len; j++ ) {
              wx.getBLEDeviceCharacteristics({
                // 这里的 deviceId 需要已经通过 createBLEConnection 与对应设备建立链接
                deviceId,
                // 这里的 serviceId 需要在 getBLEDeviceServices 接口中获取
                serviceId: services.services[j].uuid,
                success (res) {
                  console.log('device getBLEDeviceCharacteristics:', res.characteristics);
                  jLen = j;
                  for ( let k = 0, pLen = res.characteristics.length; k < pLen; k++ ) {
                    kLen = k;
                    if ( (res.characteristics[k].properties.indicate
                      || res.characteristics[k].properties.notify) && !that.notifyUuid ) {
                      that.notifyServiceId = services.services[j].uuid;
                      that.notifyUuid = res.characteristics[k].uuid;
                    }

                    if ( res.characteristics[k].properties.read && !that.readUuid ) {
                      that.readServiceId = services.services[j].uuid;
                      that.readUuid = res.characteristics[k].uuid;
                    }

                    if ( res.characteristics[k].properties.write && !that.writeUuid ) {
                      that.writeServiceId = services.services[j].uuid;
                      that.writeUuid = res.characteristics[k].uuid;
                    }
                  }
                  if ( jLen == services.services.length-1
                      && kLen == res.characteristics.length-1 ) {
                    wx.notifyBLECharacteristicValueChange({
                      state: true,
                      deviceId,
                      serviceId: that.notifyServiceId,
                      characteristicId: that.notifyUuid,
                      success (res) {
                        console.log('notifyBLECharacteristicValueChange success', res.errMsg)
                        wx.onBLECharacteristicValueChange(function(characteristic) {
                          console.log('characteristic value comed:', characteristic)
                          console.log(that.ab2str(characteristic.value))
                          console.log(characteristic.value)
                          // wx.readBLECharacteristicValue({
                          //   deviceId,
                          //   serviceId: that.readServiceId,
                          //   characteristicId: that.readUuid,
                          //   success (res) {
                          //     console.log('readBLECharacteristicValue:', res)
                          //   }
                          // })
                          that.setDataToBlue(null, 1)
                        })
                      }
                    })
                  }
                }
              })
            }
          },
          complete(res) {
            console.log(res)
          }
        })
      }
    })
  },
  pay(event) {
    app.pay(0.01, this.setDataToBlue(event));
  },
  setDataToBlue(event) {
    let that = this;
    let data = null;
    if ( event && event.currentTarget.dataset.senddata ) {
      data = event.currentTarget.dataset.senddata;
    }
    let buffer = new ArrayBuffer(data)
    let dataView = new DataView(buffer)
    dataView.setUint8(0, 0);
    wx.writeBLECharacteristicValue({
      deviceId: that.deviceId,
      serviceId: that.writeServiceId,
      characteristicId: that.writeUuid,
      value: buffer,
      success (res) {
        console.log('writeBLECharacteristicValue success', res)
      }
    })
  },
  ab2str(buffer) {
    return String.fromCharCode.apply(null, new Uint8Array(buffer));
  },
  closeBluetooth() {
    wx.closeBLEConnection({
      deviceId: this.deviceId,
      success (res) {
        console.log(res)
      }
    });
    wx.closeBluetoothAdapter({
      success (res) {
        console.log(res)
      }
    })
  }
})