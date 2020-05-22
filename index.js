/****
 * 
 * @description 腾讯视频好莱坞会员V力值签到，支持两次签到：一次正常签到，一次手机签到。
 * @author QiaTia
 * @create_at 2020-05-22
*/

'use strict'

const _key = ''
const ref_url = ""
const _cookie = ""
const auth = getAuth()
// {
//   "tvfe_boss_uuid":"*****",
//   "video_guid":"*****",
//   "video_platform":"2",
//   "pgv_pvid":"*****",
//   "pgv_info":"ssid=*****",
//   "pgv_pvi":"*****",
//   "pgv_si":"*****",
//   "_qpsvr_localtk":"*****",
//   "RK":"*****",
//   "ptcz":"*****",
//   "ptui_loginuin":"*****",
//   "main_login":"qq",
//   "vqq_access_token":"*****",
//   "vqq_appid":"*****",
//   "vqq_openid":"*****",
//   "vqq_vuserid":"*****",
//   "vqq_vusession":"*****"
// }

const axios = require('axios')
const time = new Date().toLocaleDateString()
const headers = {
  'Referer': 'https://v.qq.com',
  'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.204 Safari/537.36',
  'Cookie': _cookie
}
/**
 * @description 封装一个解析setCookie的方法
 * @param {*} val
 * @returns obj
 */
function parseSet(c_list) {
  let obj = {}
  c_list.map(t=>{
    const obj = {}
    t.split(', ')[0].split(';').forEach(item=>{
      const [key, val] = item.split('=')
      obj[key] = val
    })
    return obj
  }).forEach(t=>obj = { ...obj, ...t })
  return obj
}

/**
 * @description 获取有效的cookie参数
 * @param {*} [c=_cookie]
 * @returns obj
 */
function getAuth(c = _cookie) {
  const needParams = ["tvfe_boss_uuid","video_guid","video_platform","pgv_pvid","pgv_info","pgv_pvi","pgv_si","_qpsvr_localtk","RK","ptcz","ptui_loginuin","main_login","vqq_access_token","vqq_appid","vqq_openid","vqq_vuserid","vqq_vusession"]
  const obj = {}
  c.split('; ').forEach(t=>{
    const [key, val] = t.split(/\=(.*)$/,2)
    needParams.indexOf(key) !=-1 && ( obj[key] = val)
  })
  return obj
}

/**
 *
 * @description 方糖微信通知
 * @param { string } text
 * @param { string } desp
 * @returns Promise
 */
function pushTo(text, desp){
  if(!_key) return Promise.reject("Not SCKEY!")
  if(!text) return Promise.reject("text is must have")
  desp +=`
  > ${time}`
  console.log({text, desp, _key})
  return axios.get(`http://sc.ftqq.com/${_key}.send`, {params:{ text, desp }})
}

/**
 * @description 刷新每天跟新cookie参数
 * @returns 
 */
function refCookie(url = ref_url) {
  return new Promise((resovle, reject)=>{
    axios({ url, headers }).then(e =>{
      const { vqq_vusession } = parseSet(e.headers['set-cookie'])
      auth['vqq_vusession'] = vqq_vusession
      // 刷新cookie后去签到
      resovle({
        ...headers, Cookie: Object.keys(auth).map(i => i + '=' + auth[i]).join('; '),
        'Referer': 'https://m.v.qq.com'
      })
    }).catch(reject)
  })
}

// 签到1
function txVideoSignIn(headers){
  const url = `https://vip.video.qq.com/fcgi-bin/comm_cgi?name=hierarchical_task_system&cmd=2&_=${ parseInt(Math.random()*1000) }`
  return new Promise((resovle, reject) => {
    axios({ url, headers })
    .then(({ data })=>{
      if(/Account Verify Error/.test(data)) reject('地址1签到失败, cookies失效！' + data)
      else resovle('No1 Checkin Done!')
    }).catch(e=>reject('地址1访问失败！'))
  })
}
// 签到2
function txVideoCheckin(headers){
  const url = 'https://v.qq.com/x/bu/mobile_checkin'
  return new Promise((resovle, reject) => {
    axios({ url, headers })
    .then(({ data })=>{
      if(/Unauthorized/.test(data)) reject('地址2签到失败, cookies失效！' + data)
      else resovle('No2 Checkin Done!')
    }).catch(e=>reject('地址2访问失败！'))
  })
}

exports.main = () => new Promise((resovle, reject) => refCookie()
  .then(params=>Promise.all([ txVideoSignIn(params), txVideoCheckin(params)])
    .then(e=>resovle(pushTo(...e)))
    .catch(e=>reject(pushTo(...e)))
  ).catch(e=>{
    console.log(e)
    pushTo("腾讯视频签到通知", "获取Cookie失败，大概Cookie失效")
  })
)
