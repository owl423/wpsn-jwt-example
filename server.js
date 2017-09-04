const express = require('express')
const bodyParser = require('body-parser')

/** 
 * JWT의 사용을 위해 두 패키지가 필요합니다.
 * jsonwebtoken: JWT의 생성과 검증을 위한 범용 패키지입니다. 여기에서는 JWT 생성을 위해 사용하고 있습니다.
 * express-jwt: JWT가 요청에 포함되어 서버에 들어왔을 때, 해당 토큰을 검증 및 변환해서 `req.user`에 저장해주는 express 미들웨어입니다.
 */
const jwt = require('jsonwebtoken')
const expressJwt = require('express-jwt')


// 토큰의 서명을 위해 필요한 비밀 키를 저장해둡니다.
const SECRET = 'mysecret'

const app = express()
const jsonMiddleware = bodyParser.json()

app.use(express.static('public'))

/**
 * 인증 미들웨어 생성
 * 
 * `expressJwt()`로 생성된 미들웨어의 기능은 다음과 같습니다.
 *
 * 1. `Authorization: Bearer <token>` 형태로 jwt가 들어왔는지 검사하고
 * 2. 토큰이 없으면 401 Unauthorized 응답을 보낸다.
 * 3. 토큰이 있으면 토큰에 들어있는 JSON 정보를 객체로 변환한 후 `req.user`에 저장한다.
 *
 * 미들웨어 생성 시에 서명에 필요한 secret을 전달해 줍니다.
 */
const authMiddleware = expressJwt({secret: SECRET})

const users = [
  {
    username: 'fast',
    password: 'campus',
    isAdmin: true
  },
  {
    username: 'foo',
    password: 'bar'
  }
]

/**
 * `/auth` 경로로 들어온 사용자 이름과 비밀번호를 users 배열과 대조한 후
 * 일치하는 계정이 있다면 해당 계정 정보를 가지고 JWT 토큰을 만들어서 응답한다.
 */
app.post('/auth', jsonMiddleware, (req, res) => {
  const {username, password} = req.body
  const matched = users.find(user => user.username === username && user.password === password)
  if (matched) {
    // `jwt.sign` 메소드는 새로운 JWT 토큰을 생성한다.
    // 토큰에 넣을 객체와 서명에 필요한 secret을 전달한다.
    const token = jwt.sign({username, isAdmin: matched.isAdmin}, SECRET)
    res.send({
      ok: true,
      token
    })
  } else {
    // 일치하는 계정이 없으면 400 응답
    res.status(400)
    res.send({
      ok: false,
      error: 'No matched user'
    })
  }
})

/**
 * 토큰에 들어있는 정보를 그대로 반환하는 라우트 핸들러
 */
app.get('/auth', authMiddleware, (req, res) => {
  res.send(req.user)
})

/**
 * JWT로 인증이 된 요청만 API를 사용할 수 있게 해준다.
 */
app.get('/some-api', authMiddleware, (req, res) => {
  res.send({
    ok: true,
    message: 'Hello JWT!'
  })
})

let count = 0
app.post('/count', authMiddleware, (req, res) => {
  count += 1
  res.send({
    ok: true,
    count
  })
})

app.listen(3000, () => {
  console.log('listening...')
})
