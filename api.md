## 协议规范

- 所有的时间戳均采用**timestamp** 表示,精确到毫秒 
- 如果相关字段为空,提供相应的缺省值。比如一个类型为`string`的字段为 空, 提供`""`; 一个类型为`number`的字段为空, 提供 0
- 所有参数一律小写
- 所有接口名称一律小写，多个语义单词用下划线分隔，如`custom_profile`
- 服务端响应一律使用 JSON 格式的封装对象，已标注除外，格式如下

```json
{
    "status": 0/*服务器响应状态*/,
    "message": "success"/*服务器响应消息*/,
    "data":{}
}
```

### status 公用状态定义

- 200 成功 
- 300 错误

### 字段类型说明

- object：JSON 对象，default:｛｝
- array：数组，default :[]
- string：字符串，default: ""
- number：数字类型，主要是整型，额外说明的除外
- data：封装返回的数据，default:{}

### HTTP基本方法说明

- GET: 向服务器查询数据请求,返回请求数据或错误码。
- POST: 向服务器请求添加新条目,返回处理状态值
- PUT: 向服务器发送修改条目请求,返回处理状态值
- DELETE: 向服务器发送删除条目请求,返回处理状态值


### 创建任务接口

- URL：`/task`
- 支持的请求类型：POST 
- 请求格式：

| 参数名       |  类型  | 描述                                                         | 默认值 | 是否必填 |
| :---------- | :----: | :----------------------------------------------------------- | :----: | :------: |
| script_id    | string | 脚本id                                               |   ""   |   Yes    |
| owner_id    | string | 三元组id                                               |   ""   |   Yes    |
| name    | string | 任务名称                                                  |   ""   |   Yes    |
| params    | object | 该模板所需的任务参数，不同告警类型不同                     |   ""   |   Yes    |
| time    | number | 任务执行时间（毫秒）                                    |   ""   |   Yes    |

#### 数据对象定义
- owner_id: 由 组织-部门-用户 这一架构关联的id，主要用于查询任务时获取当前owner下的所有任务。（如：要获取 DBJ-软件部-李某 创建过的所有任务，此时owner_id为aaa123;
若要获取 DBJ-李某 创建过的所有任务，李某可能在硬件部下也创建过任务，此时只需查询组织DBJ下用户李某创建的任务，此时的owner_id可以是bbb456）
- params: 根据任务的模板不同，可以分为 订阅型任务和周期型任务。然后订阅型任务根据不同的告警规则又可以划分成 超速告警任务、温度异常告警任务、湿度异常告警任务、
燃油余量过低告警、车辆电瓶电压过低告警任务、围栏告警任务、车辆离线告警任务、单次长时间停留告警任务、单次空转时间超长告警任务、单次引擎工作时间超长告警任务、保养到期告警任务

#### 超速告警
| 参数名       |  类型  | 描述                                                         | 默认值 | 是否必填 |
| :---------- | :----: | :----------------------------------------------------------- | :----: | :------: |
| speed    | number | 触发告警的速度阈值                                            |   ""   |   Yes    |

#### 温度异常告警
| 参数名       |  类型  | 描述                                                         | 默认值 | 是否必填 |
| :---------- | :----: | :----------------------------------------------------------- | :----: | :------: |
| temperature_highest    | number | 触发告警的最高温度值                                |   ""   |   Yes    |
| temperature_lowest    | number | 触发告警的最低温度值                                 |   ""   |   Yes    |

#### 湿度异常告警
| 参数名       |  类型  | 描述                                                         | 默认值 | 是否必填 |
| :---------- | :----: | :----------------------------------------------------------- | :----: | :------: |
| humidity_highest    | number | 触发告警的最高湿度值                                   |   ""   |   Yes    |
| humidity_lowest    | number | 触发告警的最低湿度值                                   |   ""   |   Yes    |

#### 燃油余量过低告警
| 参数名       |  类型  | 描述                                                         | 默认值 | 是否必填 |
| :---------- | :----: | :----------------------------------------------------------- | :----: | :------: |
| fuel_left    | number | 触发告警的燃料余量阈值                                        |   ""   |   Yes    |

#### 车辆电瓶电压过低告警
| 参数名       |  类型  | 描述                                                         | 默认值 | 是否必填 |
| :---------- | :----: | :----------------------------------------------------------- | :----: | :------: |
| vehicle_voltage    | number | 触发告警的电压余量阈值                                  |   ""   |   Yes    |

#### 围栏告警
| 参数名       |  类型  | 描述                                                         | 默认值 | 是否必填 |
| :---------- | :----: | :----------------------------------------------------------- | :----: | :------: |
| radius    | number | 围栏半径（单位米）                                                |   ""   |   Yes    |
| lng    | number | 围栏中心点经度                                                      |   ""   |   Yes    |
| lat    | number | 围栏中心点纬度                                                      |   ""   |   Yes    |

#### 车辆离线告警
| 参数名       |  类型  | 描述                                                         | 默认值 | 是否必填 |
| :---------- | :----: | :----------------------------------------------------------- | :----: | :------: |
| offline_interval     | number | 车辆离线时间（单位秒）                                |   ""   |   Yes    |

#### 单次长时间停留告警
| 参数名       |  类型  | 描述                                                         | 默认值 | 是否必填 |
| :---------- | :----: | :----------------------------------------------------------- | :----: | :------: |
| speed    | number | 触发告警的速度阈值                                            |   ""   |   Yes    |

#### 单次空转时间超长告警
| 参数名       |  类型  | 描述                                                         | 默认值 | 是否必填 |
| :---------- | :----: | :----------------------------------------------------------- | :----: | :------: |
| speed    | number | 触发告警的速度阈值                                            |   ""   |   Yes    |

#### 单次引擎工作时间超长告警
| 参数名       |  类型  | 描述                                                         | 默认值 | 是否必填 |
| :---------- | :----: | :----------------------------------------------------------- | :----: | :------: |
| speed    | number | 触发告警的速度阈值                                            |   ""   |   Yes    |

#### 保养到期告警告警
| 参数名       |  类型  | 描述                                                         | 默认值 | 是否必填 |
| :---------- | :----: | :----------------------------------------------------------- | :----: | :------: |
| speed    | number | 触发告警的速度阈值                                            |   ""   |   Yes    |

Example:
```json
{
	"script_id": "5b14f6fb63b20c41b8f3c5e3",
	"owner_id": "6666",
	"name": "666_task",
	"time": 1528100862000,
	"params": {
		"periodValue": 1,
		"formatValue": 0
	}
} // 周期性任务参数示例
```

- 响应格式：

| 参数名    | 参数类型 | 描述                                               |
| :-------- | :------: | :------------------------------------------------- |
| status    |  string  | 状态                                               |
| message   |  string  | 提示语                            |
| data      |  object  | 包含下列参数                                       | 

Example:

```json
{
    "status": 200,
    "message": "操作成功",
    "data":{ 
    }
}
```