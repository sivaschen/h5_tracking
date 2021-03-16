<template>
  <div class="mapDiv">
    <div id="mapContainer"></div>
    <div class="selectDevice">
      <p class="last" @click="lastDevice">^</p>
      <p class="next" @click="nextDevice">^</p>
    </div>
    <div class="info">
      <div class="statusInfo">
        <span class="state">{{currentDevice.speed > 0 ? "行驶" : "静止"}}</span>&nbsp;&nbsp;&nbsp;
        <span class="time">2小时</span>
        <span class="separator">|</span>
        <span class="locatingType">北斗GPS</span>
        <span class="toPlayback" @click="toPlayBack">回放</span>
      </div>
      <hr>
      <div class="nameAndAddress">
        <p class="name">{{currentDevice.name}}</p>
        <p class="address">{{address}}</p>
      </div>
    </div>
  </div>
</template>

<script>
import imgUrl from './../assets/car.png'

export default {
  data() {
    return {
      address: "",
      firstLoad:true,
      center: [113.280637, 23.125178],
      zoom: 11,
      controls: [{name: "mapType"}],
      currentIndex: 0,
      deviceList: [
        {
          imei:1,
          lng:113.300037,
          lat:23.125178,
          name:111,
          speed:0
        },{
          imei:2,
          lng:113.410037,
          lat:23.125178,
          name:112,
          speed:1
        },{
          imei:3,
          lng:113.520037,
          lat:23.125178,
          name:113,
          speed:0
        },{
          imei:4,
          lng:113.631037,
          lat:23.125178,
          name:114,
          speed:2
        }
      ],
      markers: [],
      icon: {
        iconUrl:imgUrl  
      },
      currentDevice: {
        imei:1,
        lng:113.300037,
        lat:23.125178,
        speed: 12,
        name:114,
        address: ""
      },
      infowindow: {
        content: "",
        target: null
      }
    };
  },
  mounted(){
    this.map = new T.Map('mapContainer');
    this.map.centerAndZoom(new T.LngLat(113.280637, 23.125178), 11);
    //添加控件
    var ctrl = new T.Control.MapType();
    this.map.addControl(ctrl);
    this.addMarkers();
  },
  created(){    
    window.getDataCallback = this.getDataCallback.bind(this);
    // this.getLocationData()
    this.getAddress()
  },
  beforeDestroy(){
    window.getDataCallback = null;
  },
  methods: {
    toPlayBack(){
      this.$router.push({name:"Playback"})
    },
    lastDevice(){
      if(this.currentIndex) {
        this.currentIndex--
      } else {
        this.currentIndex = this.deviceList.length -1;
      };
      this.currentDevice = this.deviceList[this.currentIndex];
      this.getAddress()
      this.map.centerAndZoom(new T.LngLat(this.currentDevice.lng, this.currentDevice.lat), 11);
      this.currentMarker = this.markers[this.currentIndex];
      this.currentMarker.openInfoWindow(this.currentMarker.infowindow);
    },
    nextDevice(){
      if(this.currentIndex == (this.deviceList.length -1)) {
        this.currentIndex = 0;
      } else {
        this.currentIndex++;
      };
      this.currentDevice = this.deviceList[this.currentIndex];
      this.getAddress();
      
      this.map.centerAndZoom(new T.LngLat(this.currentDevice.lng, this.currentDevice.lat), 11);
      this.currentMarker = this.markers[this.currentIndex]
      this.currentMarker.openInfoWindow(this.currentMarker.infowindow)


    },
    getLocationData(){
      window.native.call(JSON.stringify({
        cmd: "getData",
        param:{
        },
        callback: "getDataCallback"
        }));
        
    },
    getDataCallback(data){
      if(data.errcode == 0) {
        this.deviceList = data.data;
        this.currentDevice = this.deviceList[this.currentIndex];
        this.getAddress();
        if(this.firstLoad){
          this.map.centerAndZoom(new T.LngLat(this.currentDevice.lng, this.currentDevice.lat), 11);
          this.addMarkers();
        }
      } else {
        console.error('获取数据失败')
      }
      setTimeout(this.getLocationData, 3000);
    },
    getAddress(){
      const url = encodeURI("http://api.tianditu.gov.cn/geocoder?postStr={'lon': " +this.currentDevice.lng+ ",'lat':"+this.currentDevice.lat+",'ver':1}&type=geocode&tk=02c77be419309f75163b54b1d6109427")
      this.$axios({
        method: 'get',
        url})
      .then((response) => {
        this.address = response.data.result.formatted_address
      })
      .catch(function (error) {
        console.log(error);
      });
    },
    addMarkers(){        
      const _that = this;
      for (let i = 0; i < this.deviceList.length; i++) {
        let item = this.deviceList[i];
        var lnglat = new T.LngLat(item.lng, item.lat);
        //创建信息窗口对象
         //创建信息窗口对象
        var infoWin = new T.InfoWindow();
        infoWin.setLngLat(lnglat);
        //设置信息窗口要显示的内容
        infoWin.setContent(String(item.name));
        //向地图上添加信息窗口
        // this.map.addOverLay(infoWin);
         //创建图片对象
        var icon = new T.Icon({
          iconUrl: imgUrl,
        });
        //创建标注对象
        var marker = new T.Marker(lnglat, {icon:icon});
        this.markers.push(marker);
        marker.infowindow = infoWin;
        marker.index = i;
        marker.addEventListener("click", function () {
          let info = this.infowindow;
          this.openInfoWindow(info);
          _that.currentDevice = _that.deviceList[this.index];
          _that.getAddress()
        });
        //向地图上添加标注
        this.map.addOverLay(marker);
        
      }
    },
    openInfowidow({ target, extData }) {
      console.log(target)
      console.log(extData)
      this.infowindow = {
        target,
        content: `<span>${extData}</span>`
      };
    }
  }
};
</script>

<style scoped lang="less">
.mapDiv {
  width: 100%;
  height: 100%;
  position: relative;
  .tdt-control-copyright {
    visibility: hidden;
  }
}
#mapContainer {
  height: 100%;
  width: 100%;
}
.info {
  position: absolute;
  bottom: 0px;
  height: 200px;
  background-color: #fff;
  width: 100%;
  z-index: 1001;
  border-radius: 15px 15px 0px 0px;
  padding: 20px;
  box-sizing: border-box;
  text-align: left;

  .statusInfo {
    margin-top: 15px;
    .state {
      color: skyblue;
    }
    .time {
      color: skyblue;
      margin-left: 10px;
    }
    .separator {
      margin-right: 10px;
      margin-left: 10px;
    }
    .toPlayback {
      float: right;
      color: rgb(44, 117, 167);
    }
  }
  .nameAndAddress {
    margin-top: 15px;
    p {
      margin: 0;
      padding: 0;
    }
    .address {
      margin-top: 3px;
    }
  }
}
  .selectDevice {
    position: absolute;
    top: 40%;
    right: 10px;
    z-index: 1001;
    height: 70px;
    width: 30px;
    p {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background-color: #fff;
      margin: 0px;
      font-size: 22px;
        line-height: 40px;
      &.next {
        margin-top: 10px;
        transform: rotateX(180deg);
      }
    }
  }

</style>