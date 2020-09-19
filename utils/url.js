const flag = 'uat';
if (flag == 'pro') {
  var host = 'https://iot.why-dong.com';
} else {
  var host = 'http://localhost';
}

const api = {
  getOpenId: host + '/wxPay/getOpenId',
  pay: host + '/wxPay/pay'
};

const request = function (url, data, method, success, fail) {
  wx.request({
    url: url,
    data: data,
    method: method,
    header: {
      'content-type': 'application/json'
    },
    success: function (res) {
      success(res);
    },
    fail: function (res) {
      fail(res);
    }
  })
}

module.exports = {
  api: api,
  request: request
}