import axios from 'axios'

const service = axios.create({
    baseURL: "http://wausa.nl:3003/", // api的base_url
    timeout: 5000 // request timeout
  })

export default service
