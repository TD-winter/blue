const flag = 'dev';
var host = ''
if (flag == 'pro') {
  host = 'https://www.xasjiot.com/';
} else {
  host = 'http://127.0.0.1';
}

const api = {
  getOpenId: host + '/wxPay/getOpenId',
  pay: host + '/wxPay/pay',
  addPayHistoryList: host + '/wxPay/addPayHistoryList'
};

const request = function (url, data, method, success, fail) {
  url = host + url
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