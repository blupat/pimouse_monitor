var ros = new ROSLIB.Ros({ url : 'ws://' + location.hostname + ':9000' });

ros.on('connection', function(){ console.log('websocket: connected'); });
ros.on('error', function(error){ console.log('websocket error: ', error); });
ros.on('close', function(){ console.log('websocket: closed'); });

var ls = new ROSLIB.Topic({
	ros : ros,
	name : '/lightsensors',
	messageType : 'pimouse_ros/LightSensorValues'
});

ls.subscribe(function(message){
	for( e in message ){
		document.getElementById(e).innerHTML = message[e];
	}
});

var on = new ROSLIB.Service({
	ros : ros,
	name : '/motor_on',
	messageType : 'std_srvs/Trigger'
});

var off = new ROSLIB.Service({
	ros : ros,
	name : '/motor_off',
	messageType : 'std_srvs/Trigger'
});

var isOn = false;
var intervalId;

function pubMotorValues(){
	fw = document.getElementById('vel_fw').innerHTML;
	rot = document.getElementById('vel_rot').innerHTML;
	
	fw = parseInt(fw) * 0.001;
	rot = 3.141592 * parseInt(rot) / 180;
	v = new ROSLIB.Message({linear:{x:fw,y:0,z:0}, angular:{x:0,y:0,z:rot}});
	vel.publish(v)
}

document.getElementById('motor_on').addEventListener(
	'click',
	function(e){
		isOn = true;
		intervalId = setInterval(pubMotorValues, 100);
		on.callService(
			ROSLIB.ServiceRequest(), 
			function(result){
				if(result.success){
					document.getElementById('motor_on').className = 'btn btn-danger';
					document.getElementById('motor_off').className = 'btn btn-default';
				}
			}
		);
	}
);

document.getElementById('motor_off').addEventListener(
	'click',
	function(e){
		if(isOn){
			clearInterval(intervalId);
			document.getElementById('vel_fw').innerHTML = 0;
			document.getElementById('vel_rot').innerHTML = 0;
			pubMotorValues();
			isOn = false;
		}
		off.callService(
			ROSLIB.ServiceRequest(), 
			function(result){
				if(result.success){
					document.getElementById('motor_on').className = 'btn btn-default';
					document.getElementById('motor_off').className = 'btn btn-primary';
				}
			}
		);
	}
);

var vel = new ROSLIB.Topic({
	ros : ros,
	name : '/cmd_vel',
	messageType : 'geometry_msgs/Twist'
});

document.getElementById('touchmotion').addEventListener(
	'click',
	function(e){
		if(!isOn){
			return;
		}
		rect = $('#touchmotion')[0].getBoundingClientRect();
		x = e.pageX - rect.left - window.pageXOffset;
		y = e.pageY - rect.top - window.pageYOffset;
		
		vel_fw = (rect.height / 2 - y) * 3;
		vel_rot = rect.width / 2 - x;
		document.getElementById('vel_fw').innerHTML = parseInt(vel_fw);
		document.getElementById('vel_rot').innerHTML = parseInt(vel_rot);
	}
);

document.getElementById('camstream').data = 'http://'
	+ location.hostname
	+ ':10000/stream?topic=/cv_camera_node/image_raw';
