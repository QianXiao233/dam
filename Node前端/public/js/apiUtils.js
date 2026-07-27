const BASE_URL="10.186.140.99"
//const BASE_URL="192.168.10.251";
//const BASE_URL="127.0.0.1"
window.apiUrls = {

    python_ip:"10.186.140.97",
    SOCKET_URL: "ws://"+BASE_URL+":8085/websocket",
    VEDIO_URL: "http://10.186.140.97:5000/video_feed",
    WATER_LP_URL: "http://"+BASE_URL+":5000/getdata",
    WATER_CTL_OPEN_URL: "http://"+BASE_URL+":8085/RelayControl/Open",
    WATER_CTL_CLOSE_URL: "http://"+BASE_URL+":8085/RelayControl/Close",
    WATER_CTL_WARNING_URL: "http://"+BASE_URL+":5000/predict_result",
    java_url:"http://"+BASE_URL+":8085/api"
};