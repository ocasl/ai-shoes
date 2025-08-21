# comfyui

**简介**:comfyui

**HOST**:http://localhost:8080

**联系人**:

**Version**:v1.0

**接口路径**:/v3/api-docs

[TOC]

# 任务管理

## 查询任务状态

**接口地址**:`/task/status/{taskId}`

**请求方式**:`GET`

**请求数据类型**:`application/x-www-form-urlencoded`

**响应数据类型**:`*/*`

**接口描述**:<p>查询任务执行状态</p>

**请求参数**:

| 参数名称 | 参数说明 | 请求类型 | 是否必须 | 数据类型 | schema |
| -------- | -------- | -------- | -------- | -------- | ------ |
| taskId   |          | path     | true     | string   |        |

**响应状态**:

| 状态码 | 说明 | schema       |
| ------ | ---- | ------------ |
| 200    | OK   | 通用返回对象 |

**响应参数**:

| 参数名称 | 参数说明 | 类型           | schema         |
| -------- | -------- | -------------- | -------------- |
| code     |          | integer(int32) | integer(int32) |
| msg      |          | string         |                |
| data     |          | object         |                |

**响应示例**:

```javascript
{
	"code": 0,
	"msg": "",
	"data": {}
}
```

## 查询任务结果

**接口地址**:`/task/result/{taskId}`

**请求方式**:`GET`

**请求数据类型**:`application/x-www-form-urlencoded`

**响应数据类型**:`*/*`

**接口描述**:<p>查询任务执行结果</p>

**请求参数**:

| 参数名称 | 参数说明 | 请求类型 | 是否必须 | 数据类型 | schema |
| -------- | -------- | -------- | -------- | -------- | ------ |
| taskId   |          | path     | true     | string   |        |

**响应状态**:

| 状态码 | 说明 | schema       |
| ------ | ---- | ------------ |
| 200    | OK   | 通用返回对象 |

**响应参数**:

| 参数名称 | 参数说明 | 类型           | schema         |
| -------- | -------- | -------------- | -------------- |
| code     |          | integer(int32) | integer(int32) |
| msg      |          | string         |                |
| data     |          | object         |                |

**响应示例**:

```javascript
{
	"code": 0,
	"msg": "",
	"data": {}
}
```

# 模型模块

## 查询所有的模型

**接口地址**:`/lore/list`

**请求方式**:`GET`

**请求数据类型**:`application/x-www-form-urlencoded`

**响应数据类型**:`*/*`

**接口描述**:<p>查询所有的模型</p>

**请求参数**:

暂无

**响应状态**:

| 状态码 | 说明 | schema       |
| ------ | ---- | ------------ |
| 200    | OK   | 通用返回对象 |

**响应参数**:

| 参数名称 | 参数说明 | 类型           | schema         |
| -------- | -------- | -------------- | -------------- |
| code     |          | integer(int32) | integer(int32) |
| msg      |          | string         |                |
| data     |          | object         |                |

**响应示例**:

```javascript
{
	"code": 0,
	"msg": "",
	"data": {}
}
```

# sam 分割

## 根据图片 ID 进行分割

**接口地址**:`/sam/segment`

**请求方式**:`POST`

**请求数据类型**:`application/x-www-form-urlencoded`

**响应数据类型**:`*/*`

**接口描述**:<p>前端传图片 ID，后端调用 Python 分割接口</p>

**请求参数**:

| 参数名称 | 参数说明 | 请求类型 | 是否必须 | 数据类型       | schema |
| -------- | -------- | -------- | -------- | -------------- | ------ |
| imageId  |          | query    | true     | integer(int64) |        |

**响应状态**:

| 状态码 | 说明 | schema       |
| ------ | ---- | ------------ |
| 200    | OK   | 通用返回对象 |

**响应参数**:

| 参数名称 | 参数说明 | 类型           | schema         |
| -------- | -------- | -------------- | -------------- |
| code     |          | integer(int32) | integer(int32) |
| msg      |          | string         |                |
| data     |          | object         |                |

**响应示例**:

```javascript
{
	"code": 0,
	"msg": "",
	"data": {}
}
```

# 图生图

## 自动配色

**接口地址**:`/image/zdps`

**请求方式**:`POST`

**请求数据类型**:`application/x-www-form-urlencoded,application/json`

**响应数据类型**:`*/*`

**接口描述**:<p>自动配色</p>

**请求示例**:

```javascript
{
  "majorId": 0,
  "minorId": 0,
  "prompt": ""
}
```

**请求参数**:

| 参数名称            | 参数说明 | 请求类型 | 是否必须 | 数据类型       | schema   |
| ------------------- | -------- | -------- | -------- | -------------- | -------- |
| 自动配色            | 自动配色 | body     | true     | 自动配色       | 自动配色 |
| &emsp;&emsp;majorId | 主图     |          | true     | integer(int32) |          |
| &emsp;&emsp;minorId | 参考图   |          | true     | integer(int32) |          |
| &emsp;&emsp;prompt  | 关键词   |          | false    | string         |          |

**响应状态**:

| 状态码 | 说明 | schema       |
| ------ | ---- | ------------ |
| 200    | OK   | 通用返回对象 |

**响应参数**:

| 参数名称 | 参数说明 | 类型           | schema         |
| -------- | -------- | -------------- | -------------- |
| code     |          | integer(int32) | integer(int32) |
| msg      |          | string         |                |
| data     |          | object         |                |

**响应示例**:

```javascript
{
	"code": 0,
	"msg": "",
	"data": {}
}
```

## 线稿图

**接口地址**:`/image/xgt`

**请求方式**:`POST`

**请求数据类型**:`application/x-www-form-urlencoded,application/json`

**响应数据类型**:`*/*`

**接口描述**:<p>线稿图</p>

**请求示例**:

```javascript
{
  "imageId": 0
}
```

**请求参数**:

| 参数名称            | 参数说明 | 请求类型 | 是否必须 | 数据类型       | schema |
| ------------------- | -------- | -------- | -------- | -------------- | ------ |
| 线稿图              | 线稿图   | body     | true     | 线稿图         | 线稿图 |
| &emsp;&emsp;imageId | 主图     |          | true     | integer(int32) |        |

**响应状态**:

| 状态码 | 说明 | schema       |
| ------ | ---- | ------------ |
| 200    | OK   | 通用返回对象 |

**响应参数**:

| 参数名称 | 参数说明 | 类型           | schema         |
| -------- | -------- | -------------- | -------------- |
| code     |          | integer(int32) | integer(int32) |
| msg      |          | string         |                |
| data     |          | object         |                |

**响应示例**:

```javascript
{
	"code": 0,
	"msg": "",
	"data": {}
}
```

## 去水印

**接口地址**:`/image/qsy`

**请求方式**:`POST`

**请求数据类型**:`application/x-www-form-urlencoded,application/json`

**响应数据类型**:`*/*`

**接口描述**:<p>去水印</p>

**请求示例**:

```javascript
{
  "imageId": 0
}
```

**请求参数**:

| 参数名称            | 参数说明 | 请求类型 | 是否必须 | 数据类型       | schema |
| ------------------- | -------- | -------- | -------- | -------------- | ------ |
| 去水印              | 去水印   | body     | true     | 去水印         | 去水印 |
| &emsp;&emsp;imageId | 主图     |          | true     | integer(int32) |        |

**响应状态**:

| 状态码 | 说明 | schema       |
| ------ | ---- | ------------ |
| 200    | OK   | 通用返回对象 |

**响应参数**:

| 参数名称 | 参数说明 | 类型           | schema         |
| -------- | -------- | -------------- | -------------- |
| code     |          | integer(int32) | integer(int32) |
| msg      |          | string         |                |
| data     |          | object         |                |

**响应示例**:

```javascript
{
	"code": 0,
	"msg": "",
	"data": {}
}
```

## 图片修复

**接口地址**:`/image/gene/xf`

**请求方式**:`POST`

**请求数据类型**:`application/x-www-form-urlencoded,application/json`

**响应数据类型**:`*/*`

**接口描述**:<p>修复（蒙版）</p>

**请求示例**:

```javascript
{
  "imageId": 0,
  "isMask": 0
}
```

**请求参数**:

| 参数名称            | 参数说明   | 请求类型 | 是否必须 | 数据类型       | schema     |
| ------------------- | ---------- | -------- | -------- | -------------- | ---------- |
| 修复(蒙版)          | 修复(蒙版) | body     | true     | 修复(蒙版)     | 修复(蒙版) |
| &emsp;&emsp;imageId | 主图       |          | true     | integer(int32) |            |
| &emsp;&emsp;isMask  | 是否是蒙版 |          | true     | integer(int32) |            |

**响应状态**:

| 状态码 | 说明 | schema       |
| ------ | ---- | ------------ |
| 200    | OK   | 通用返回对象 |

**响应参数**:

| 参数名称 | 参数说明 | 类型           | schema         |
| -------- | -------- | -------------- | -------------- |
| code     |          | integer(int32) | integer(int32) |
| msg      |          | string         |                |
| data     |          | object         |                |

**响应示例**:

```javascript
{
	"code": 0,
	"msg": "",
	"data": {}
}
```

## 鞋底换面

**接口地址**:`/image/gene/xdhh`

**请求方式**:`POST`

**请求数据类型**:`application/x-www-form-urlencoded,application/json`

**响应数据类型**:`*/*`

**接口描述**:<p>鞋底互换（蒙版）</p>

**请求示例**:

```javascript
{
  "majorId": 0,
  "minorId": 0,
  "maskStates": 0
}
```

**请求参数**:

| 参数名称               | 参数说明                                                    | 请求类型 | 是否必须 | 数据类型       | schema         |
| ---------------------- | ----------------------------------------------------------- | -------- | -------- | -------------- | -------------- |
| 鞋底互换(蒙版)         | 鞋底互换(蒙版)                                              | body     | true     | 鞋底互换(蒙版) | 鞋底互换(蒙版) |
| &emsp;&emsp;majorId    | 鞋面图                                                      |          | true     | integer(int32) |                |
| &emsp;&emsp;minorId    | 鞋底图                                                      |          | true     | integer(int32) |                |
| &emsp;&emsp;maskStates | 图片蒙蔽状态{0:不蒙蔽,1:蒙蔽斜面图,2:蒙蔽鞋底图,3:蒙蔽两图} |          | true     | integer(int32) |                |

**响应状态**:

| 状态码 | 说明 | schema       |
| ------ | ---- | ------------ |
| 200    | OK   | 通用返回对象 |

**响应参数**:

| 参数名称 | 参数说明 | 类型           | schema         |
| -------- | -------- | -------------- | -------------- |
| code     |          | integer(int32) | integer(int32) |
| msg      |          | string         |                |
| data     |          | object         |                |

**响应示例**:

```javascript
{
	"code": 0,
	"msg": "",
	"data": {}
}
```

## 元素消除

**接口地址**:`/image/gene/xc`

**请求方式**:`POST`

**请求数据类型**:`application/x-www-form-urlencoded,application/json`

**响应数据类型**:`*/*`

**接口描述**:<p>消除（蒙版）</p>

**请求示例**:

```javascript
{
  "imageId": 0,
  "isMask": 0
}
```

**请求参数**:

| 参数名称            | 参数说明   | 请求类型 | 是否必须 | 数据类型       | schema     |
| ------------------- | ---------- | -------- | -------- | -------------- | ---------- |
| 消除(蒙版)          | 消除(蒙版) | body     | true     | 消除(蒙版)     | 消除(蒙版) |
| &emsp;&emsp;imageId | 主图       |          | true     | integer(int32) |            |
| &emsp;&emsp;isMask  | 是否是蒙版 |          | true     | integer(int32) |            |

**响应状态**:

| 状态码 | 说明 | schema       |
| ------ | ---- | ------------ |
| 200    | OK   | 通用返回对象 |

**响应参数**:

| 参数名称 | 参数说明 | 类型           | schema         |
| -------- | -------- | -------------- | -------------- |
| code     |          | integer(int32) | integer(int32) |
| msg      |          | string         |                |
| data     |          | object         |                |

**响应示例**:

```javascript
{
	"code": 0,
	"msg": "",
	"data": {}
}
```

## 款式延伸

**接口地址**:`/image/gene/tstok`

**请求方式**:`POST`

**请求数据类型**:`application/x-www-form-urlencoded,application/json`

**响应数据类型**:`*/*`

**接口描述**:<p>图加图 OK</p>

**请求示例**:

```javascript
{
  "imageId": 0,
  "loreName": "",
  "denoise": 0
}
```

**请求参数**:

| 参数名称             | 参数说明      | 请求类型 | 是否必须 | 数据类型       | schema    |
| -------------------- | ------------- | -------- | -------- | -------------- | --------- |
| 图生图 OK            | 图生图 OK     | body     | true     | 图生图 OK      | 图生图 OK |
| &emsp;&emsp;imageId  | 主图          |          | true     | integer(int32) |           |
| &emsp;&emsp;loreName | 模型名称      |          | true     | string         |           |
| &emsp;&emsp;denoise  | 噪点强度{0-1} |          | true     | number(float)  |           |

**响应状态**:

| 状态码 | 说明 | schema       |
| ------ | ---- | ------------ |
| 200    | OK   | 通用返回对象 |

**响应参数**:

| 参数名称 | 参数说明 | 类型           | schema         |
| -------- | -------- | -------------- | -------------- |
| code     |          | integer(int32) | integer(int32) |
| msg      |          | string         |                |
| data     |          | object         |                |

**响应示例**:

```javascript
{
	"code": 0,
	"msg": "",
	"data": {}
}
```

## 款式融合

**接口地址**:`/image/gene/tjtws`

**请求方式**:`POST`

**请求数据类型**:`application/x-www-form-urlencoded,application/json`

**响应数据类型**:`*/*`

**接口描述**:<p>图加图无锁</p>

**请求示例**:

```javascript
{
  "loreName": "",
  "majorId": 0,
  "minorId": 0,
  "majorStrength": 0,
  "minorStrength": 0
}
```

**请求参数**:

| 参数名称                  | 参数说明   | 请求类型 | 是否必须 | 数据类型       | schema     |
| ------------------------- | ---------- | -------- | -------- | -------------- | ---------- |
| 图生图无锁                | 图生图模型 | body     | true     | 图生图无锁     | 图生图无锁 |
| &emsp;&emsp;loreName      | 模型名称   |          | true     | string         |            |
| &emsp;&emsp;majorId       | 主图       |          | true     | integer(int32) |            |
| &emsp;&emsp;minorId       | 附图       |          | true     | integer(int32) |            |
| &emsp;&emsp;majorStrength | 主图强度   |          | true     | number(double) |            |
| &emsp;&emsp;minorStrength | 附图强度   |          | true     | number(double) |            |

**响应状态**:

| 状态码 | 说明 | schema       |
| ------ | ---- | ------------ |
| 200    | OK   | 通用返回对象 |

**响应参数**:

| 参数名称 | 参数说明 | 类型           | schema         |
| -------- | -------- | -------------- | -------------- |
| code     |          | integer(int32) | integer(int32) |
| msg      |          | string         |                |
| data     |          | object         |                |

**响应示例**:

```javascript
{
	"code": 0,
	"msg": "",
	"data": {}
}
```

## 款式融合(主体加强)

**接口地址**:`/image/gene/strhzxs`

**请求方式**:`POST`

**请求数据类型**:`application/x-www-form-urlencoded,application/json`

**响应数据类型**:`*/*`

**接口描述**:<p>图像融合最新锁</p>

**请求示例**:

```javascript
{
  "loreName": "",
  "majorId": 0,
  "minorId": 0,
  "majorStrength": 0,
  "minorStrength": 0,
  "structuralStrength": 0
}
```

**请求参数**:

| 参数名称                       | 参数说明     | 请求类型 | 是否必须 | 数据类型       | schema       |
| ------------------------------ | ------------ | -------- | -------- | -------------- | ------------ |
| 图生图最新锁                   | 图生图最新锁 | body     | true     | 图生图最新锁   | 图生图最新锁 |
| &emsp;&emsp;loreName           | 模型名称     |          | true     | string         |              |
| &emsp;&emsp;majorId            | 主图 Id      |          | true     | integer(int32) |              |
| &emsp;&emsp;minorId            | 附图 Id      |          | true     | integer(int32) |              |
| &emsp;&emsp;majorStrength      | 主图强度     |          | true     | number(double) |              |
| &emsp;&emsp;minorStrength      | 附图强度     |          | true     | number(double) |              |
| &emsp;&emsp;structuralStrength | 结构强度     |          | true     | number(double) |              |

**响应状态**:

| 状态码 | 说明 | schema       |
| ------ | ---- | ------------ |
| 200    | OK   | 通用返回对象 |

**响应参数**:

| 参数名称 | 参数说明 | 类型           | schema         |
| -------- | -------- | -------------- | -------------- |
| code     |          | integer(int32) | integer(int32) |
| msg      |          | string         |                |
| data     |          | object         |                |

**响应示例**:

```javascript
{
	"code": 0,
	"msg": "",
	"data": {}
}
```

## 文字创款

**接口地址**:`/image/gene/lorewst`

**请求方式**:`POST`

**请求数据类型**:`application/x-www-form-urlencoded,application/json`

**响应数据类型**:`*/*`

**接口描述**:<p>Lore 文生图</p>

**请求示例**:

```javascript
{
  "prompt": "",
  "loreName": ""
}
```

**请求参数**:

| 参数名称             | 参数说明    | 请求类型 | 是否必须 | 数据类型    | schema      |
| -------------------- | ----------- | -------- | -------- | ----------- | ----------- |
| lore 文生图          | Lore 文生图 | body     | true     | Lore 文生图 | Lore 文生图 |
| &emsp;&emsp;prompt   | 关键词      |          | true     | string      |             |
| &emsp;&emsp;loreName | 模型名称    |          | true     | string      |             |

**响应状态**:

| 状态码 | 说明 | schema       |
| ------ | ---- | ------------ |
| 200    | OK   | 通用返回对象 |

**响应参数**:

| 参数名称 | 参数说明 | 类型           | schema         |
| -------- | -------- | -------------- | -------------- |
| code     |          | integer(int32) | integer(int32) |
| msg      |          | string         |                |
| data     |          | object         |                |

**响应示例**:

```javascript
{
	"code": 0,
	"msg": "",
	"data": {}
}
```

## 一键抠图

**接口地址**:`/image/gene/kt`

**请求方式**:`POST`

**请求数据类型**:`application/x-www-form-urlencoded,application/json`

**响应数据类型**:`*/*`

**接口描述**:<p>抠图</p>

**请求示例**:

```javascript
{
  "imageId": 0
}
```

**请求参数**:

| 参数名称            | 参数说明 | 请求类型 | 是否必须 | 数据类型       | schema   |
| ------------------- | -------- | -------- | -------- | -------------- | -------- |
| 一键抠图            | 一键抠图 | body     | true     | 一键抠图       | 一键抠图 |
| &emsp;&emsp;imageId | 图像     |          | true     | integer(int32) |          |

**响应状态**:

| 状态码 | 说明 | schema       |
| ------ | ---- | ------------ |
| 200    | OK   | 通用返回对象 |

**响应参数**:

| 参数名称 | 参数说明 | 类型           | schema         |
| -------- | -------- | -------------- | -------------- |
| code     |          | integer(int32) | integer(int32) |
| msg      |          | string         |                |
| data     |          | object         |                |

**响应示例**:

```javascript
{
	"code": 0,
	"msg": "",
	"data": {}
}
```

## 局部修改

**接口地址**:`/image/gene/jbch`

**请求方式**:`POST`

**请求数据类型**:`application/x-www-form-urlencoded,application/json`

**响应数据类型**:`*/*`

**接口描述**:<p>局部重绘（蒙版）</p>

**请求示例**:

```javascript
{
  "majorId": 0,
  "minorId": 0,
  "prompt": "",
  "isMask": 0
}
```

**请求参数**:

| 参数名称            | 参数说明                                     | 请求类型 | 是否必须 | 数据类型       | schema     |
| ------------------- | -------------------------------------------- | -------- | -------- | -------------- | ---------- |
| 关键词重绘          | 关键词重绘                                   | body     | true     | 关键词重绘     | 关键词重绘 |
| &emsp;&emsp;majorId | 主图                                         |          | true     | integer(int32) |            |
| &emsp;&emsp;minorId | 附图                                         |          | true     | integer(int32) |            |
| &emsp;&emsp;prompt  | 关键词                                       |          | false    | string         |            |
| &emsp;&emsp;isMask  | 图片蒙蔽状态{0:不蒙蔽,1:主图蒙蔽,2:二图蒙蔽} |          | true     | integer(int32) |            |

**响应状态**:

| 状态码 | 说明 | schema       |
| ------ | ---- | ------------ |
| 200    | OK   | 通用返回对象 |

**响应参数**:

| 参数名称 | 参数说明 | 类型           | schema         |
| -------- | -------- | -------------- | -------------- |
| code     |          | integer(int32) | integer(int32) |
| msg      |          | string         |                |
| data     |          | object         |                |

**响应示例**:

```javascript
{
	"code": 0,
	"msg": "",
	"data": {}
}
```

## 高清放大

**接口地址**:`/image/gene/gqfd`

**请求方式**:`POST`

**请求数据类型**:`application/x-www-form-urlencoded,application/json`

**响应数据类型**:`*/*`

**接口描述**:<p>高清放大</p>

**请求示例**:

```javascript
{
  "imageId": 0
}
```

**请求参数**:

| 参数名称            | 参数说明 | 请求类型 | 是否必须 | 数据类型       | schema   |
| ------------------- | -------- | -------- | -------- | -------------- | -------- |
| 高清放大            | 高清放大 | body     | true     | 高清放大       | 高清放大 |
| &emsp;&emsp;imageId | 主图     |          | true     | integer(int32) |          |

**响应状态**:

| 状态码 | 说明 | schema       |
| ------ | ---- | ------------ |
| 200    | OK   | 通用返回对象 |

**响应参数**:

| 参数名称 | 参数说明 | 类型           | schema         |
| -------- | -------- | -------------- | -------------- |
| code     |          | integer(int32) | integer(int32) |
| msg      |          | string         |                |
| data     |          | object         |                |

**响应示例**:

```javascript
{
	"code": 0,
	"msg": "",
	"data": {}
}
```

## 查询任务结果

**接口地址**:`/image/task/result/{taskId}`

**请求方式**:`GET`

**请求数据类型**:`application/x-www-form-urlencoded`

**响应数据类型**:`*/*`

**接口描述**:<p>查询任务结果</p>

**请求参数**:

| 参数名称 | 参数说明 | 请求类型 | 是否必须 | 数据类型 | schema |
| -------- | -------- | -------- | -------- | -------- | ------ |
| taskId   |          | path     | true     | string   |        |

**响应状态**:

| 状态码 | 说明 | schema       |
| ------ | ---- | ------------ |
| 200    | OK   | 通用返回对象 |

**响应参数**:

| 参数名称 | 参数说明 | 类型           | schema         |
| -------- | -------- | -------------- | -------------- |
| code     |          | integer(int32) | integer(int32) |
| msg      |          | string         |                |
| data     |          | object         |                |

**响应示例**:

```javascript
{
	"code": 0,
	"msg": "",
	"data": {}
}
```

## 请求等待结果

**接口地址**:`/image/request`

**请求方式**:`GET`

**请求数据类型**:`application/x-www-form-urlencoded`

**响应数据类型**:`*/*`

**接口描述**:<p>请求等待结果</p>

**请求参数**:

| 参数名称 | 参数说明 | 请求类型 | 是否必须 | 数据类型 | schema |
| -------- | -------- | -------- | -------- | -------- | ------ |
| taskId   |          | query    | true     | string   |        |

**响应状态**:

| 状态码 | 说明 | schema       |
| ------ | ---- | ------------ |
| 200    | OK   | 通用返回对象 |

**响应参数**:

| 参数名称 | 参数说明 | 类型           | schema         |
| -------- | -------- | -------------- | -------------- |
| code     |          | integer(int32) | integer(int32) |
| msg      |          | string         |                |
| data     |          | object         |                |

**响应示例**:

```javascript
{
	"code": 0,
	"msg": "",
	"data": {}
}
```

# 用户管理

## 修改用户信息

**接口地址**:`/admin/update`

**请求方式**:`PUT`

**请求数据类型**:`application/x-www-form-urlencoded,application/json`

**响应数据类型**:`*/*`

**接口描述**:<p>修改用户信息</p>

**请求示例**:

```javascript
{
  "username": "",
  "password": "",
  "nickname": "",
  "sex": 0,
  "avatar": "",
  "phone": "",
  "smsCode": "",
  "admin": true,
  "credentialsNonExpired": true,
  "accountNonExpired": true,
  "accountNonLocked": true
}
```

**请求参数**:

| 参数名称                          | 参数说明                                   | 请求类型 | 是否必须 | 数据类型          | schema |
| --------------------------------- | ------------------------------------------ | -------- | -------- | ----------------- | ------ |
| 用户类                            | 用户类                                     | body     | true     | 用户类            | 用户类 |
| &emsp;&emsp;id                    | 主键                                       |          | false    | integer(int32)    |        |
| &emsp;&emsp;uid                   | 用户唯一标识                               |          | false    | string            |        |
| &emsp;&emsp;username              | 用户名                                     |          | true     | string            |        |
| &emsp;&emsp;password              | 密码                                       |          | true     | string            |        |
| &emsp;&emsp;nickname              | 昵称                                       |          | true     | string            |        |
| &emsp;&emsp;sex                   | 性别,0:女,1:男,2:未知                      |          | false    | integer(int32)    |        |
| &emsp;&emsp;avatar                | 头像                                       |          | false    | string            |        |
| &emsp;&emsp;phone                 | 手机号                                     |          | true     | string            |        |
| &emsp;&emsp;role                  | 角色,VISITOR:访客,MEMBER:会员,ADMIN:管理员 |          | false    | string            |        |
| &emsp;&emsp;remark                | 备注                                       |          | false    | string            |        |
| &emsp;&emsp;expireTime            | 过期时间                                   |          | false    | string(date-time) |        |
| &emsp;&emsp;enabled               | 状态,0:禁用,1:正常                         |          | false    | boolean           |        |
| &emsp;&emsp;deleted               | 是否删除,0:否,1:是                         |          | false    | integer(int32)    |        |
| &emsp;&emsp;updateTime            | 更新时间                                   |          | false    | string(date-time) |        |
| &emsp;&emsp;createTime            | 创建时间                                   |          | false    | string(date-time) |        |
| &emsp;&emsp;creator               | 创建人                                     |          | false    | string            |        |
| &emsp;&emsp;updater               | 更新人                                     |          | false    | string            |        |
| &emsp;&emsp;smsCode               | 短信验证码                                 |          | false    | string            |        |
| &emsp;&emsp;admin                 |                                            |          | false    | boolean           |        |
| &emsp;&emsp;credentialsNonExpired |                                            |          | false    | boolean           |        |
| &emsp;&emsp;accountNonExpired     |                                            |          | false    | boolean           |        |
| &emsp;&emsp;accountNonLocked      |                                            |          | false    | boolean           |        |

**响应状态**:

| 状态码 | 说明 | schema       |
| ------ | ---- | ------------ |
| 200    | OK   | 通用返回对象 |

**响应参数**:

| 参数名称 | 参数说明 | 类型           | schema         |
| -------- | -------- | -------------- | -------------- |
| code     |          | integer(int32) | integer(int32) |
| msg      |          | string         |                |
| data     |          | object         |                |

**响应示例**:

```javascript
{
	"code": 0,
	"msg": "",
	"data": {}
}
```

## 解封用户

**接口地址**:`/admin/unban/{id}`

**请求方式**:`PUT`

**请求数据类型**:`application/x-www-form-urlencoded`

**响应数据类型**:`*/*`

**接口描述**:<p>解封用户</p>

**请求参数**:

| 参数名称 | 参数说明 | 请求类型 | 是否必须 | 数据类型       | schema |
| -------- | -------- | -------- | -------- | -------------- | ------ |
| id       |          | path     | true     | integer(int32) |        |

**响应状态**:

| 状态码 | 说明 | schema       |
| ------ | ---- | ------------ |
| 200    | OK   | 通用返回对象 |

**响应参数**:

| 参数名称 | 参数说明 | 类型           | schema         |
| -------- | -------- | -------------- | -------------- |
| code     |          | integer(int32) | integer(int32) |
| msg      |          | string         |                |
| data     |          | object         |                |

**响应示例**:

```javascript
{
	"code": 0,
	"msg": "",
	"data": {}
}
```

## 封禁用户

**接口地址**:`/admin/ban/{id}`

**请求方式**:`PUT`

**请求数据类型**:`application/x-www-form-urlencoded`

**响应数据类型**:`*/*`

**接口描述**:<p>封禁用户</p>

**请求参数**:

| 参数名称 | 参数说明 | 请求类型 | 是否必须 | 数据类型       | schema |
| -------- | -------- | -------- | -------- | -------------- | ------ |
| id       |          | path     | true     | integer(int32) |        |

**响应状态**:

| 状态码 | 说明 | schema       |
| ------ | ---- | ------------ |
| 200    | OK   | 通用返回对象 |

**响应参数**:

| 参数名称 | 参数说明 | 类型           | schema         |
| -------- | -------- | -------------- | -------------- |
| code     |          | integer(int32) | integer(int32) |
| msg      |          | string         |                |
| data     |          | object         |                |

**响应示例**:

```javascript
{
	"code": 0,
	"msg": "",
	"data": {}
}
```

## 批量生成邀请码

**接口地址**:`/admin/invitationCode`

**请求方式**:`POST`

**请求数据类型**:`application/x-www-form-urlencoded,application/json`

**响应数据类型**:`*/*`

**接口描述**:<p>批量生成邀请码</p>

**请求示例**:

```javascript
{
  "id": 0,
  "code": "",
  "userId": 0,
  "expiresAt": "",
  "usedAt": 0,
  "isActive": 0,
  "createTime": "",
  "updateTime": "",
  "creator": "",
  "updater": "",
  "remark": "",
  "deleted": 0,
  "number": 0
}
```

**请求参数**:

| 参数名称               | 参数说明           | 请求类型 | 是否必须 | 数据类型          | schema    |
| ---------------------- | ------------------ | -------- | -------- | ----------------- | --------- |
| 邀请码 VO              | 邀请码 VO          | body     | true     | 邀请码 VO         | 邀请码 VO |
| &emsp;&emsp;id         | user               |          | false    | integer(int64)    |           |
| &emsp;&emsp;code       | code               |          | false    | string            |           |
| &emsp;&emsp;userId     | userId             |          | false    | integer(int32)    |           |
| &emsp;&emsp;expiresAt  | 过期时间           |          | false    | string(date-time) |           |
| &emsp;&emsp;usedAt     | 可使用时间(单位天) |          | false    | integer(int32)    |           |
| &emsp;&emsp;isActive   | 是否激活           |          | false    | integer(int32)    |           |
| &emsp;&emsp;createTime | 创建时间           |          | false    | string(date-time) |           |
| &emsp;&emsp;updateTime | 更新时间           |          | false    | string(date-time) |           |
| &emsp;&emsp;creator    | 创建者             |          | false    | string            |           |
| &emsp;&emsp;updater    | 更新者             |          | false    | string            |           |
| &emsp;&emsp;remark     | 备注               |          | false    | string            |           |
| &emsp;&emsp;deleted    | 是否删除           |          | false    | integer(int32)    |           |
| &emsp;&emsp;number     | 生成邀请码数量     |          | false    | integer(int32)    |           |

**响应状态**:

| 状态码 | 说明 | schema       |
| ------ | ---- | ------------ |
| 200    | OK   | 通用返回对象 |

**响应参数**:

| 参数名称 | 参数说明 | 类型           | schema         |
| -------- | -------- | -------------- | -------------- |
| code     |          | integer(int32) | integer(int32) |
| msg      |          | string         |                |
| data     |          | object         |                |

**响应示例**:

```javascript
{
	"code": 0,
	"msg": "",
	"data": {}
}
```

## 查询所有用户信息

**接口地址**:`/admin/list`

**请求方式**:`GET`

**请求数据类型**:`application/x-www-form-urlencoded`

**响应数据类型**:`*/*`

**接口描述**:<p>查询所有用户信息</p>

**请求参数**:

暂无

**响应状态**:

| 状态码 | 说明 | schema |
| ------ | ---- | ------ |
| 200    | OK   | 用户类 |

**响应参数**:

| 参数名称              | 参数说明                                   | 类型              | schema            |
| --------------------- | ------------------------------------------ | ----------------- | ----------------- |
| id                    | 主键                                       | integer(int32)    | integer(int32)    |
| uid                   | 用户唯一标识                               | string            |                   |
| username              | 用户名                                     | string            |                   |
| password              | 密码                                       | string            |                   |
| nickname              | 昵称                                       | string            |                   |
| sex                   | 性别,0:女,1:男,2:未知                      | integer(int32)    | integer(int32)    |
| avatar                | 头像                                       | string            |                   |
| phone                 | 手机号                                     | string            |                   |
| role                  | 角色,VISITOR:访客,MEMBER:会员,ADMIN:管理员 | string            |                   |
| remark                | 备注                                       | string            |                   |
| expireTime            | 过期时间                                   | string(date-time) | string(date-time) |
| enabled               | 状态,0:禁用,1:正常                         | boolean           |                   |
| deleted               | 是否删除,0:否,1:是                         | integer(int32)    | integer(int32)    |
| updateTime            | 更新时间                                   | string(date-time) | string(date-time) |
| createTime            | 创建时间                                   | string(date-time) | string(date-time) |
| creator               | 创建人                                     | string            |                   |
| updater               | 更新人                                     | string            |                   |
| smsCode               | 短信验证码                                 | string            |                   |
| admin                 |                                            | boolean           |                   |
| credentialsNonExpired |                                            | boolean           |                   |
| accountNonExpired     |                                            | boolean           |                   |
| accountNonLocked      |                                            | boolean           |                   |

**响应示例**:

```javascript
[
  {
    username: "",
    password: "",
    nickname: "",
    sex: 0,
    avatar: "",
    phone: "",
    smsCode: "",
    admin: true,
    credentialsNonExpired: true,
    accountNonExpired: true,
    accountNonLocked: true,
  },
];
```

## 批量查询未使用的邀请码

**接口地址**:`/admin/invitationCode/list`

**请求方式**:`GET`

**请求数据类型**:`application/x-www-form-urlencoded`

**响应数据类型**:`*/*`

**接口描述**:<p>批量查询未使用的邀请码</p>

**请求参数**:

暂无

**响应状态**:

| 状态码 | 说明 | schema   |
| ------ | ---- | -------- |
| 200    | OK   | 邀请码类 |

**响应参数**:

| 参数名称   | 参数说明           | 类型              | schema            |
| ---------- | ------------------ | ----------------- | ----------------- |
| id         | user               | integer(int64)    | integer(int64)    |
| code       | code               | string            |                   |
| userId     | userId             | integer(int32)    | integer(int32)    |
| expiresAt  | 过期时间           | string(date-time) | string(date-time) |
| usedAt     | 可使用时间(单位天) | integer(int32)    | integer(int32)    |
| isActive   | 是否激活           | integer(int32)    | integer(int32)    |
| createTime | 创建时间           | string(date-time) | string(date-time) |
| updateTime | 更新时间           | string(date-time) | string(date-time) |
| creator    | 创建者             | string            |                   |
| updater    | 更新者             | string            |                   |
| remark     | 备注               | string            |                   |
| deleted    | 是否删除           | integer(int32)    | integer(int32)    |

**响应示例**:

```javascript
[
  {
    id: 0,
    code: "",
    userId: 0,
    expiresAt: "",
    usedAt: 0,
    isActive: 0,
    createTime: "",
    updateTime: "",
    creator: "",
    updater: "",
    remark: "",
    deleted: 0,
  },
];
```

## 查询用户信息

**接口地址**:`/admin/get/{id}`

**请求方式**:`GET`

**请求数据类型**:`application/x-www-form-urlencoded`

**响应数据类型**:`*/*`

**接口描述**:<p>查询用户信息</p>

**请求参数**:

| 参数名称 | 参数说明 | 请求类型 | 是否必须 | 数据类型       | schema |
| -------- | -------- | -------- | -------- | -------------- | ------ |
| id       |          | path     | true     | integer(int32) |        |

**响应状态**:

| 状态码 | 说明 | schema |
| ------ | ---- | ------ |
| 200    | OK   | 用户类 |

**响应参数**:

| 参数名称              | 参数说明                                   | 类型              | schema            |
| --------------------- | ------------------------------------------ | ----------------- | ----------------- |
| id                    | 主键                                       | integer(int32)    | integer(int32)    |
| uid                   | 用户唯一标识                               | string            |                   |
| username              | 用户名                                     | string            |                   |
| password              | 密码                                       | string            |                   |
| nickname              | 昵称                                       | string            |                   |
| sex                   | 性别,0:女,1:男,2:未知                      | integer(int32)    | integer(int32)    |
| avatar                | 头像                                       | string            |                   |
| phone                 | 手机号                                     | string            |                   |
| role                  | 角色,VISITOR:访客,MEMBER:会员,ADMIN:管理员 | string            |                   |
| remark                | 备注                                       | string            |                   |
| expireTime            | 过期时间                                   | string(date-time) | string(date-time) |
| enabled               | 状态,0:禁用,1:正常                         | boolean           |                   |
| deleted               | 是否删除,0:否,1:是                         | integer(int32)    | integer(int32)    |
| updateTime            | 更新时间                                   | string(date-time) | string(date-time) |
| createTime            | 创建时间                                   | string(date-time) | string(date-time) |
| creator               | 创建人                                     | string            |                   |
| updater               | 更新人                                     | string            |                   |
| smsCode               | 短信验证码                                 | string            |                   |
| admin                 |                                            | boolean           |                   |
| credentialsNonExpired |                                            | boolean           |                   |
| accountNonExpired     |                                            | boolean           |                   |
| accountNonLocked      |                                            | boolean           |                   |

**响应示例**:

```javascript
{
	"username": "",
	"password": "",
	"nickname": "",
	"sex": 0,
	"avatar": "",
	"phone": "",
	"smsCode": "",
	"admin": true,
	"credentialsNonExpired": true,
	"accountNonExpired": true,
	"accountNonLocked": true
}
```

## 删除用户信息

**接口地址**:`/admin/delete/{id}`

**请求方式**:`DELETE`

**请求数据类型**:`application/x-www-form-urlencoded`

**响应数据类型**:`*/*`

**接口描述**:<p>删除用户信息</p>

**请求参数**:

| 参数名称 | 参数说明 | 请求类型 | 是否必须 | 数据类型       | schema |
| -------- | -------- | -------- | -------- | -------------- | ------ |
| id       |          | path     | true     | integer(int32) |        |

**响应状态**:

| 状态码 | 说明 | schema       |
| ------ | ---- | ------------ |
| 200    | OK   | 通用返回对象 |

**响应参数**:

| 参数名称 | 参数说明 | 类型           | schema         |
| -------- | -------- | -------------- | -------------- |
| code     |          | integer(int32) | integer(int32) |
| msg      |          | string         |                |
| data     |          | object         |                |

**响应示例**:

```javascript
{
	"code": 0,
	"msg": "",
	"data": {}
}
```

# 用户个人信息

## 根据邀请码升级用户权限

**接口地址**:`/user/upgrade/{id}/{code}`

**请求方式**:`PUT`

**请求数据类型**:`application/x-www-form-urlencoded`

**响应数据类型**:`*/*`

**接口描述**:<p>根据邀请码升级用户权限</p>

**请求参数**:

| 参数名称 | 参数说明  | 请求类型 | 是否必须 | 数据类型 | schema |
| -------- | --------- | -------- | -------- | -------- | ------ |
| id       | 用户 id   | path     | true     | string   |        |
| code     | 邀请码 id | path     | true     | string   |        |

**响应状态**:

| 状态码 | 说明 | schema       |
| ------ | ---- | ------------ |
| 200    | OK   | 通用返回对象 |

**响应参数**:

| 参数名称 | 参数说明 | 类型           | schema         |
| -------- | -------- | -------------- | -------------- |
| code     |          | integer(int32) | integer(int32) |
| msg      |          | string         |                |
| data     |          | object         |                |

**响应示例**:

```javascript
{
	"code": 0,
	"msg": "",
	"data": {}
}
```

## 修改用户信息

**接口地址**:`/user/update`

**请求方式**:`PUT`

**请求数据类型**:`application/x-www-form-urlencoded,application/json`

**响应数据类型**:`*/*`

**接口描述**:<p>修改用户信息</p>

**请求示例**:

```javascript
{
  "username": "",
  "password": "",
  "nickname": "",
  "sex": 0,
  "avatar": "",
  "phone": "",
  "smsCode": "",
  "admin": true,
  "credentialsNonExpired": true,
  "accountNonExpired": true,
  "accountNonLocked": true
}
```

**请求参数**:

| 参数名称                          | 参数说明                                   | 请求类型 | 是否必须 | 数据类型          | schema |
| --------------------------------- | ------------------------------------------ | -------- | -------- | ----------------- | ------ |
| 用户类                            | 用户类                                     | body     | true     | 用户类            | 用户类 |
| &emsp;&emsp;id                    | 主键                                       |          | false    | integer(int32)    |        |
| &emsp;&emsp;uid                   | 用户唯一标识                               |          | false    | string            |        |
| &emsp;&emsp;username              | 用户名                                     |          | true     | string            |        |
| &emsp;&emsp;password              | 密码                                       |          | true     | string            |        |
| &emsp;&emsp;nickname              | 昵称                                       |          | true     | string            |        |
| &emsp;&emsp;sex                   | 性别,0:女,1:男,2:未知                      |          | false    | integer(int32)    |        |
| &emsp;&emsp;avatar                | 头像                                       |          | false    | string            |        |
| &emsp;&emsp;phone                 | 手机号                                     |          | true     | string            |        |
| &emsp;&emsp;role                  | 角色,VISITOR:访客,MEMBER:会员,ADMIN:管理员 |          | false    | string            |        |
| &emsp;&emsp;remark                | 备注                                       |          | false    | string            |        |
| &emsp;&emsp;expireTime            | 过期时间                                   |          | false    | string(date-time) |        |
| &emsp;&emsp;enabled               | 状态,0:禁用,1:正常                         |          | false    | boolean           |        |
| &emsp;&emsp;deleted               | 是否删除,0:否,1:是                         |          | false    | integer(int32)    |        |
| &emsp;&emsp;updateTime            | 更新时间                                   |          | false    | string(date-time) |        |
| &emsp;&emsp;createTime            | 创建时间                                   |          | false    | string(date-time) |        |
| &emsp;&emsp;creator               | 创建人                                     |          | false    | string            |        |
| &emsp;&emsp;updater               | 更新人                                     |          | false    | string            |        |
| &emsp;&emsp;smsCode               | 短信验证码                                 |          | false    | string            |        |
| &emsp;&emsp;admin                 |                                            |          | false    | boolean           |        |
| &emsp;&emsp;credentialsNonExpired |                                            |          | false    | boolean           |        |
| &emsp;&emsp;accountNonExpired     |                                            |          | false    | boolean           |        |
| &emsp;&emsp;accountNonLocked      |                                            |          | false    | boolean           |        |

**响应状态**:

| 状态码 | 说明 | schema       |
| ------ | ---- | ------------ |
| 200    | OK   | 通用返回对象 |

**响应参数**:

| 参数名称 | 参数说明 | 类型           | schema         |
| -------- | -------- | -------------- | -------------- |
| code     |          | integer(int32) | integer(int32) |
| msg      |          | string         |                |
| data     |          | object         |                |

**响应示例**:

```javascript
{
	"code": 0,
	"msg": "",
	"data": {}
}
```

## 注册用户

**接口地址**:`/user/register`

**请求方式**:`POST`

**请求数据类型**:`application/x-www-form-urlencoded,application/json`

**响应数据类型**:`*/*`

**接口描述**:<p>注册用户</p>

**请求示例**:

```javascript
{
  "username": "",
  "password": "",
  "nickname": "",
  "sex": 0,
  "avatar": "",
  "phone": "",
  "smsCode": "",
  "admin": true,
  "credentialsNonExpired": true,
  "accountNonExpired": true,
  "accountNonLocked": true
}
```

**请求参数**:

| 参数名称                          | 参数说明                                   | 请求类型 | 是否必须 | 数据类型          | schema |
| --------------------------------- | ------------------------------------------ | -------- | -------- | ----------------- | ------ |
| 用户类                            | 用户类                                     | body     | true     | 用户类            | 用户类 |
| &emsp;&emsp;id                    | 主键                                       |          | false    | integer(int32)    |        |
| &emsp;&emsp;uid                   | 用户唯一标识                               |          | false    | string            |        |
| &emsp;&emsp;username              | 用户名                                     |          | true     | string            |        |
| &emsp;&emsp;password              | 密码                                       |          | true     | string            |        |
| &emsp;&emsp;nickname              | 昵称                                       |          | true     | string            |        |
| &emsp;&emsp;sex                   | 性别,0:女,1:男,2:未知                      |          | false    | integer(int32)    |        |
| &emsp;&emsp;avatar                | 头像                                       |          | false    | string            |        |
| &emsp;&emsp;phone                 | 手机号                                     |          | true     | string            |        |
| &emsp;&emsp;role                  | 角色,VISITOR:访客,MEMBER:会员,ADMIN:管理员 |          | false    | string            |        |
| &emsp;&emsp;remark                | 备注                                       |          | false    | string            |        |
| &emsp;&emsp;expireTime            | 过期时间                                   |          | false    | string(date-time) |        |
| &emsp;&emsp;enabled               | 状态,0:禁用,1:正常                         |          | false    | boolean           |        |
| &emsp;&emsp;deleted               | 是否删除,0:否,1:是                         |          | false    | integer(int32)    |        |
| &emsp;&emsp;updateTime            | 更新时间                                   |          | false    | string(date-time) |        |
| &emsp;&emsp;createTime            | 创建时间                                   |          | false    | string(date-time) |        |
| &emsp;&emsp;creator               | 创建人                                     |          | false    | string            |        |
| &emsp;&emsp;updater               | 更新人                                     |          | false    | string            |        |
| &emsp;&emsp;smsCode               | 短信验证码                                 |          | false    | string            |        |
| &emsp;&emsp;admin                 |                                            |          | false    | boolean           |        |
| &emsp;&emsp;credentialsNonExpired |                                            |          | false    | boolean           |        |
| &emsp;&emsp;accountNonExpired     |                                            |          | false    | boolean           |        |
| &emsp;&emsp;accountNonLocked      |                                            |          | false    | boolean           |        |

**响应状态**:

| 状态码 | 说明 | schema       |
| ------ | ---- | ------------ |
| 200    | OK   | 通用返回对象 |

**响应参数**:

| 参数名称 | 参数说明 | 类型           | schema         |
| -------- | -------- | -------------- | -------------- |
| code     |          | integer(int32) | integer(int32) |
| msg      |          | string         |                |
| data     |          | object         |                |

**响应示例**:

```javascript
{
	"code": 0,
	"msg": "",
	"data": {}
}
```

## 查询用户信息

**接口地址**:`/user/info`

**请求方式**:`GET`

**请求数据类型**:`application/x-www-form-urlencoded`

**响应数据类型**:`*/*`

**接口描述**:<p>查询用户信息</p>

**请求参数**:

暂无

**响应状态**:

| 状态码 | 说明 | schema       |
| ------ | ---- | ------------ |
| 200    | OK   | 通用返回对象 |

**响应参数**:

| 参数名称 | 参数说明 | 类型           | schema         |
| -------- | -------- | -------------- | -------------- |
| code     |          | integer(int32) | integer(int32) |
| msg      |          | string         |                |
| data     |          | object         |                |

**响应示例**:

```javascript
{
	"code": 0,
	"msg": "",
	"data": {}
}
```

# 任务队列测试

## 测试任务提交

**接口地址**:`/test/task/submit`

**请求方式**:`POST`

**请求数据类型**:`application/x-www-form-urlencoded`

**响应数据类型**:`*/*`

**接口描述**:<p>提交一个测试任务到队列</p>

**请求参数**:

暂无

**响应状态**:

| 状态码 | 说明 | schema       |
| ------ | ---- | ------------ |
| 200    | OK   | 通用返回对象 |

**响应参数**:

| 参数名称 | 参数说明 | 类型           | schema         |
| -------- | -------- | -------------- | -------------- |
| code     |          | integer(int32) | integer(int32) |
| msg      |          | string         |                |
| data     |          | object         |                |

**响应示例**:

```javascript
{
	"code": 0,
	"msg": "",
	"data": {}
}
```

## 测试任务结果查询

**接口地址**:`/test/task/result/{taskId}`

**请求方式**:`GET`

**请求数据类型**:`application/x-www-form-urlencoded`

**响应数据类型**:`*/*`

**接口描述**:<p>查询测试任务的结果</p>

**请求参数**:

| 参数名称 | 参数说明 | 请求类型 | 是否必须 | 数据类型 | schema |
| -------- | -------- | -------- | -------- | -------- | ------ |
| taskId   |          | path     | true     | string   |        |

**响应状态**:

| 状态码 | 说明 | schema       |
| ------ | ---- | ------------ |
| 200    | OK   | 通用返回对象 |

**响应参数**:

| 参数名称 | 参数说明 | 类型           | schema         |
| -------- | -------- | -------------- | -------------- |
| code     |          | integer(int32) | integer(int32) |
| msg      |          | string         |                |
| data     |          | object         |                |

**响应示例**:

```javascript
{
	"code": 0,
	"msg": "",
	"data": {}
}
```

## 检查队列状态

**接口地址**:`/test/task/queue/status`

**请求方式**:`GET`

**请求数据类型**:`application/x-www-form-urlencoded`

**响应数据类型**:`*/*`

**接口描述**:<p>检查 Redis 队列的状态</p>

**请求参数**:

暂无

**响应状态**:

| 状态码 | 说明 | schema       |
| ------ | ---- | ------------ |
| 200    | OK   | 通用返回对象 |

**响应参数**:

| 参数名称 | 参数说明 | 类型           | schema         |
| -------- | -------- | -------------- | -------------- |
| code     |          | integer(int32) | integer(int32) |
| msg      |          | string         |                |
| data     |          | object         |                |

**响应示例**:

```javascript
{
	"code": 0,
	"msg": "",
	"data": {}
}
```

# 文件查看

## 查看文件

**接口地址**:`/file/view`

**请求方式**:`GET`

**请求数据类型**:`application/x-www-form-urlencoded`

**响应数据类型**:`*/*`

**接口描述**:<p>查看文件</p>

**请求参数**:

| 参数名称  | 参数说明 | 请求类型 | 是否必须 | 数据类型 | schema |
| --------- | -------- | -------- | -------- | -------- | ------ |
| serverId  |          | query    | true     | string   |        |
| filename  |          | query    | true     | string   |        |
| type      |          | query    | true     | string   |        |
| subfolder |          | query    | false    | string   |        |

**响应状态**:

| 状态码 | 说明 | schema |
| ------ | ---- | ------ |
| 200    | OK   |        |

**响应参数**:

暂无

**响应示例**:

```javascript

```

# OSS 上传管理

## 上传图片

**接口地址**:`/oss/upload`

**请求方式**:`POST`

**请求数据类型**:`application/x-www-form-urlencoded,application/json`

**响应数据类型**:`*/*`

**接口描述**:<p>上传图片</p>

**请求参数**:

暂无

**响应状态**:

| 状态码 | 说明 | schema       |
| ------ | ---- | ------------ |
| 200    | OK   | 通用返回对象 |

**响应参数**:

| 参数名称 | 参数说明 | 类型           | schema         |
| -------- | -------- | -------------- | -------------- |
| code     |          | integer(int32) | integer(int32) |
| msg      |          | string         |                |
| data     |          | object         |                |

**响应示例**:

```javascript
{
	"code": 0,
	"msg": "",
	"data": {}
}
```

## 上传蒙版

**接口地址**:`/oss/mask`

**请求方式**:`POST`

**请求数据类型**:`application/x-www-form-urlencoded,application/json`

**响应数据类型**:`*/*`

**接口描述**:<p>上传蒙版</p>

**请求参数**:

| 参数名称   | 参数说明    | 请求类型 | 是否必须 | 数据类型 | schema |
| ---------- | ----------- | -------- | -------- | -------- | ------ |
| originalId | 原始文件 id | query    | true     | string   |        |

**响应状态**:

| 状态码 | 说明 | schema       |
| ------ | ---- | ------------ |
| 200    | OK   | 通用返回对象 |

**响应参数**:

| 参数名称 | 参数说明 | 类型           | schema         |
| -------- | -------- | -------------- | -------------- |
| code     |          | integer(int32) | integer(int32) |
| msg      |          | string         |                |
| data     |          | object         |                |

**响应示例**:

```javascript
{
	"code": 0,
	"msg": "",
	"data": {}
}
```

## 分页查询 OSS 上传日志

**接口地址**:`/oss/page`

**请求方式**:`GET`

**请求数据类型**:`application/x-www-form-urlencoded`

**响应数据类型**:`*/*`

**接口描述**:

**请求参数**:

| 参数名称                | 参数说明                                            | 请求类型 | 是否必须 | 数据类型          | schema         |
| ----------------------- | --------------------------------------------------- | -------- | -------- | ----------------- | -------------- |
| pageVo                  | 图片上传日志表                                      | query    | true     | 图片上传日志表    | 图片上传日志表 |
| &emsp;&emsp;orderBy     | 排序字段{0:根据 example 的字段排序，1:根据耗时排序} |          | false    | integer(int32)    |                |
| &emsp;&emsp;begin       | 开始时间                                            |          | false    | string(date-time) |                |
| &emsp;&emsp;end         | 结束时间                                            |          | false    | string(date-time) |                |
| &emsp;&emsp;pageNum     | 页码，从 1 开始                                     |          | true     | integer(int32)    |                |
| &emsp;&emsp;pageSize    | 每页条数，最大值为 100                              |          | true     | integer(int32)    |                |
| &emsp;&emsp;id          | 主键                                                |          | false    | integer(int64)    |                |
| &emsp;&emsp;userId      | 上传用户 ID（关联用户表）                           |          | false    | integer(int64)    |                |
| &emsp;&emsp;username    | 上传用户名                                          |          | false    | string            |                |
| &emsp;&emsp;nickname    | 用户简称                                            |          | false    | string            |                |
| &emsp;&emsp;role        | 上传用户角色                                        |          | false    | string            |                |
| &emsp;&emsp;ossPath     | oss 文件存储路径                                    |          | false    | string            |                |
| &emsp;&emsp;ossName     | oss 文件名                                          |          | false    | string            |                |
| &emsp;&emsp;cfUploadIds | comfyui 上传表 ids                                  |          | false    | string            |                |
| &emsp;&emsp;originalId  | 蒙版原始文件 ID                                     |          | false    | integer(int32)    |                |
| &emsp;&emsp;updateTime  | 更新时间                                            |          | false    | string(date-time) |                |
| &emsp;&emsp;createTime  | 创建时间                                            |          | false    | string(date-time) |                |
| &emsp;&emsp;remark      | 备注                                                |          | false    | string            |                |
| &emsp;&emsp;deleted     | 逻辑删除                                            |          | false    | integer(int32)    |                |
| &emsp;&emsp;uid         | 用户唯一标识                                        |          | false    | string            |                |

**响应状态**:

| 状态码 | 说明 | schema       |
| ------ | ---- | ------------ |
| 200    | OK   | 通用返回对象 |

**响应参数**:

| 参数名称 | 参数说明 | 类型           | schema         |
| -------- | -------- | -------------- | -------------- |
| code     |          | integer(int32) | integer(int32) |
| msg      |          | string         |                |
| data     |          | object         |                |

**响应示例**:

```javascript
{
	"code": 0,
	"msg": "",
	"data": {}
}
```

## 回显图片

**接口地址**:`/oss/feedback`

**请求方式**:`GET`

**请求数据类型**:`application/x-www-form-urlencoded`

**响应数据类型**:`*/*`

**接口描述**:<p>回显图片</p>

**请求参数**:

| 参数名称 | 参数说明 | 请求类型 | 是否必须 | 数据类型       | schema |
| -------- | -------- | -------- | -------- | -------------- | ------ |
| imageId  |          | query    | true     | integer(int32) |        |

**响应状态**:

| 状态码 | 说明 | schema       |
| ------ | ---- | ------------ |
| 200    | OK   | 通用返回对象 |

**响应参数**:

| 参数名称 | 参数说明 | 类型           | schema         |
| -------- | -------- | -------------- | -------------- |
| code     |          | integer(int32) | integer(int32) |
| msg      |          | string         |                |
| data     |          | object         |                |

**响应示例**:

```javascript
{
	"code": 0,
	"msg": "",
	"data": {}
}
```

# 材质管理

## 上传材质

**接口地址**:`/material/upload`

**请求方式**:`POST`

**请求数据类型**:`application/x-www-form-urlencoded,application/json`

**响应数据类型**:`*/*`

**接口描述**:<p>上传新的材质文件</p>

**请求参数**:

| 参数名称 | 参数说明 | 请求类型 | 是否必须 | 数据类型       | schema |
| -------- | -------- | -------- | -------- | -------------- | ------ |
| name     |          | query    | true     | string         |        |
| type     |          | query    | true     | integer(int32) |        |
| file     |          | query    | true     | file           |        |

**响应状态**:

| 状态码 | 说明 | schema       |
| ------ | ---- | ------------ |
| 200    | OK   | 通用返回对象 |

**响应参数**:

| 参数名称 | 参数说明 | 类型           | schema         |
| -------- | -------- | -------------- | -------------- |
| code     |          | integer(int32) | integer(int32) |
| msg      |          | string         |                |
| data     |          | object         |                |

**响应示例**:

```javascript
{
	"code": 0,
	"msg": "",
	"data": {}
}
```

## 查询材质列表

**接口地址**:`/material/list`

**请求方式**:`POST`

**请求数据类型**:`application/x-www-form-urlencoded,application/json`

**响应数据类型**:`*/*`

**接口描述**:<p>分页查询材质列表，支持按名称、类型、格式筛选</p>

**请求示例**:

```javascript
{
  "orderBy": 0,
  "begin": "",
  "end": "",
  "pageNum": 1,
  "pageSize": 10,
  "name": "",
  "type": 0,
  "format": ""
}
```

**请求参数**:

| 参数名称             | 参数说明                                            | 请求类型 | 是否必须 | 数据类型          | schema      |
| -------------------- | --------------------------------------------------- | -------- | -------- | ----------------- | ----------- |
| 材质查询 VO          | 材质查询 VO                                         | body     | true     | 材质查询 VO       | 材质查询 VO |
| &emsp;&emsp;orderBy  | 排序字段{0:根据 example 的字段排序，1:根据耗时排序} |          | false    | integer(int32)    |             |
| &emsp;&emsp;begin    | 开始时间                                            |          | false    | string(date-time) |             |
| &emsp;&emsp;end      | 结束时间                                            |          | false    | string(date-time) |             |
| &emsp;&emsp;pageNum  | 页码，从 1 开始                                     |          | true     | integer(int32)    |             |
| &emsp;&emsp;pageSize | 每页条数，最大值为 100                              |          | true     | integer(int32)    |             |
| &emsp;&emsp;name     | 材质名称（模糊查询）                                |          | false    | string            |             |
| &emsp;&emsp;type     | 材质类型：0-系统材质库，1-用户材质库                |          | false    | integer(int32)    |             |
| &emsp;&emsp;format   | 文件格式                                            |          | false    | string            |             |

**响应状态**:

| 状态码 | 说明 | schema       |
| ------ | ---- | ------------ |
| 200    | OK   | 通用返回对象 |

**响应参数**:

| 参数名称 | 参数说明 | 类型           | schema         |
| -------- | -------- | -------------- | -------------- |
| code     |          | integer(int32) | integer(int32) |
| msg      |          | string         |                |
| data     |          | object         |                |

**响应示例**:

```javascript
{
	"code": 0,
	"msg": "",
	"data": {}
}
```

## 获取材质下载链接

**接口地址**:`/material/download/{id}`

**请求方式**:`POST`

**请求数据类型**:`application/x-www-form-urlencoded`

**响应数据类型**:`*/*`

**接口描述**:<p>获取材质文件的 OSS 下载链接并增加下载次数</p>

**请求参数**:

| 参数名称 | 参数说明 | 请求类型 | 是否必须 | 数据类型       | schema |
| -------- | -------- | -------- | -------- | -------------- | ------ |
| id       |          | path     | true     | integer(int64) |        |

**响应状态**:

| 状态码 | 说明 | schema       |
| ------ | ---- | ------------ |
| 200    | OK   | 通用返回对象 |

**响应参数**:

| 参数名称 | 参数说明 | 类型           | schema         |
| -------- | -------- | -------------- | -------------- |
| code     |          | integer(int32) | integer(int32) |
| msg      |          | string         |                |
| data     |          | object         |                |

**响应示例**:

```javascript
{
	"code": 0,
	"msg": "",
	"data": {}
}
```

## 获取材质详情

**接口地址**:`/material/{id}`

**请求方式**:`GET`

**请求数据类型**:`application/x-www-form-urlencoded`

**响应数据类型**:`*/*`

**接口描述**:<p>根据材质 ID 获取详细信息</p>

**请求参数**:

| 参数名称 | 参数说明 | 请求类型 | 是否必须 | 数据类型       | schema |
| -------- | -------- | -------- | -------- | -------------- | ------ |
| id       |          | path     | true     | integer(int64) |        |

**响应状态**:

| 状态码 | 说明 | schema       |
| ------ | ---- | ------------ |
| 200    | OK   | 通用返回对象 |

**响应参数**:

| 参数名称 | 参数说明 | 类型           | schema         |
| -------- | -------- | -------------- | -------------- |
| code     |          | integer(int32) | integer(int32) |
| msg      |          | string         |                |
| data     |          | object         |                |

**响应示例**:

```javascript
{
	"code": 0,
	"msg": "",
	"data": {}
}
```

## 删除材质

**接口地址**:`/material/{id}`

**请求方式**:`DELETE`

**请求数据类型**:`application/x-www-form-urlencoded`

**响应数据类型**:`*/*`

**接口描述**:<p>删除指定材质（逻辑删除）。管理员可以删除所有材质，普通用户只能删除自己的材质</p>

**请求参数**:

| 参数名称 | 参数说明 | 请求类型 | 是否必须 | 数据类型       | schema |
| -------- | -------- | -------- | -------- | -------------- | ------ |
| id       |          | path     | true     | integer(int64) |        |

**响应状态**:

| 状态码 | 说明 | schema       |
| ------ | ---- | ------------ |
| 200    | OK   | 通用返回对象 |

**响应参数**:

| 参数名称 | 参数说明 | 类型           | schema         |
| -------- | -------- | -------------- | -------------- |
| code     |          | integer(int32) | integer(int32) |
| msg      |          | string         |                |
| data     |          | object         |                |

**响应示例**:

```javascript
{
	"code": 0,
	"msg": "",
	"data": {}
}
```

# 材质测试

## 测试上传材质

**接口地址**:`/material/test/upload`

**请求方式**:`POST`

**请求数据类型**:`application/x-www-form-urlencoded,application/json`

**响应数据类型**:`*/*`

**接口描述**:<p>测试上传材质功能</p>

**请求示例**:

```javascript
{
  "name": "",
  "file": "",
  "type": 0
}
```

**请求参数**:

| 参数名称         | 参数说明                               | 请求类型 | 是否必须 | 数据类型       | schema      |
| ---------------- | -------------------------------------- | -------- | -------- | -------------- | ----------- |
| 材质上传 VO      | 材质上传 VO                            | body     | true     | 材质上传 VO    | 材质上传 VO |
| &emsp;&emsp;name | 材质名称                               |          | true     | string         |             |
| &emsp;&emsp;file |                                        |          | true     | string(binary) |             |
| &emsp;&emsp;type | 数据库类型：0-系统材质库，1-用户材质库 |          | true     | integer(int32) |             |

**响应状态**:

| 状态码 | 说明 | schema       |
| ------ | ---- | ------------ |
| 200    | OK   | 通用返回对象 |

**响应参数**:

| 参数名称 | 参数说明 | 类型           | schema         |
| -------- | -------- | -------------- | -------------- |
| code     |          | integer(int32) | integer(int32) |
| msg      |          | string         |                |
| data     |          | object         |                |

**响应示例**:

```javascript
{
	"code": 0,
	"msg": "",
	"data": {}
}
```

## 测试查询材质列表

**接口地址**:`/material/test/list`

**请求方式**:`POST`

**请求数据类型**:`application/x-www-form-urlencoded,application/json`

**响应数据类型**:`*/*`

**接口描述**:<p>测试查询材质列表功能，支持按名称、类型、格式筛选</p>

**请求示例**:

```javascript
{
  "orderBy": 0,
  "begin": "",
  "end": "",
  "pageNum": 1,
  "pageSize": 10,
  "name": "",
  "type": 0,
  "format": ""
}
```

**请求参数**:

| 参数名称             | 参数说明                                            | 请求类型 | 是否必须 | 数据类型          | schema      |
| -------------------- | --------------------------------------------------- | -------- | -------- | ----------------- | ----------- |
| 材质查询 VO          | 材质查询 VO                                         | body     | true     | 材质查询 VO       | 材质查询 VO |
| &emsp;&emsp;orderBy  | 排序字段{0:根据 example 的字段排序，1:根据耗时排序} |          | false    | integer(int32)    |             |
| &emsp;&emsp;begin    | 开始时间                                            |          | false    | string(date-time) |             |
| &emsp;&emsp;end      | 结束时间                                            |          | false    | string(date-time) |             |
| &emsp;&emsp;pageNum  | 页码，从 1 开始                                     |          | true     | integer(int32)    |             |
| &emsp;&emsp;pageSize | 每页条数，最大值为 100                              |          | true     | integer(int32)    |             |
| &emsp;&emsp;name     | 材质名称（模糊查询）                                |          | false    | string            |             |
| &emsp;&emsp;type     | 材质类型：0-系统材质库，1-用户材质库                |          | false    | integer(int32)    |             |
| &emsp;&emsp;format   | 文件格式                                            |          | false    | string            |             |

**响应状态**:

| 状态码 | 说明 | schema       |
| ------ | ---- | ------------ |
| 200    | OK   | 通用返回对象 |

**响应参数**:

| 参数名称 | 参数说明 | 类型           | schema         |
| -------- | -------- | -------------- | -------------- |
| code     |          | integer(int32) | integer(int32) |
| msg      |          | string         |                |
| data     |          | object         |                |

**响应示例**:

```javascript
{
	"code": 0,
	"msg": "",
	"data": {}
}
```

## 测试下载材质

**接口地址**:`/material/test/download/{id}`

**请求方式**:`POST`

**请求数据类型**:`application/x-www-form-urlencoded`

**响应数据类型**:`*/*`

**接口描述**:<p>测试下载材质功能</p>

**请求参数**:

| 参数名称 | 参数说明 | 请求类型 | 是否必须 | 数据类型       | schema |
| -------- | -------- | -------- | -------- | -------------- | ------ |
| id       |          | path     | true     | integer(int64) |        |

**响应状态**:

| 状态码 | 说明 | schema       |
| ------ | ---- | ------------ |
| 200    | OK   | 通用返回对象 |

**响应参数**:

| 参数名称 | 参数说明 | 类型           | schema         |
| -------- | -------- | -------------- | -------------- |
| code     |          | integer(int32) | integer(int32) |
| msg      |          | string         |                |
| data     |          | object         |                |

**响应示例**:

```javascript
{
	"code": 0,
	"msg": "",
	"data": {}
}
```

## 测试获取材质详情

**接口地址**:`/material/test/{id}`

**请求方式**:`GET`

**请求数据类型**:`application/x-www-form-urlencoded`

**响应数据类型**:`*/*`

**接口描述**:<p>测试获取材质详情功能</p>

**请求参数**:

| 参数名称 | 参数说明 | 请求类型 | 是否必须 | 数据类型       | schema |
| -------- | -------- | -------- | -------- | -------------- | ------ |
| id       |          | path     | true     | integer(int64) |        |

**响应状态**:

| 状态码 | 说明 | schema       |
| ------ | ---- | ------------ |
| 200    | OK   | 通用返回对象 |

**响应参数**:

| 参数名称 | 参数说明 | 类型           | schema         |
| -------- | -------- | -------------- | -------------- |
| code     |          | integer(int32) | integer(int32) |
| msg      |          | string         |                |
| data     |          | object         |                |

**响应示例**:

```javascript
{
	"code": 0,
	"msg": "",
	"data": {}
}
```

## 测试删除材质

**接口地址**:`/material/test/{id}`

**请求方式**:`DELETE`

**请求数据类型**:`application/x-www-form-urlencoded`

**响应数据类型**:`*/*`

**接口描述**:<p>测试删除材质功能。管理员可以删除所有材质，普通用户只能删除自己的材质</p>

**请求参数**:

| 参数名称 | 参数说明 | 请求类型 | 是否必须 | 数据类型       | schema |
| -------- | -------- | -------- | -------- | -------------- | ------ |
| id       |          | path     | true     | integer(int64) |        |

**响应状态**:

| 状态码 | 说明 | schema       |
| ------ | ---- | ------------ |
| 200    | OK   | 通用返回对象 |

**响应参数**:

| 参数名称 | 参数说明 | 类型           | schema         |
| -------- | -------- | -------------- | -------------- |
| code     |          | integer(int32) | integer(int32) |
| msg      |          | string         |                |
| data     |          | object         |                |

**响应示例**:

```javascript
{
	"code": 0,
	"msg": "",
	"data": {}
}
```

# 健康检查

## 健康检查

**接口地址**:`/health/check`

**请求方式**:`GET`

**请求数据类型**:`application/x-www-form-urlencoded`

**响应数据类型**:`*/*`

**接口描述**:<p>检查应用是否正常运行</p>

**请求参数**:

暂无

**响应状态**:

| 状态码 | 说明 | schema       |
| ------ | ---- | ------------ |
| 200    | OK   | 通用返回对象 |

**响应参数**:

| 参数名称 | 参数说明 | 类型           | schema         |
| -------- | -------- | -------------- | -------------- |
| code     |          | integer(int32) | integer(int32) |
| msg      |          | string         |                |
| data     |          | object         |                |

**响应示例**:

```javascript
{
	"code": 0,
	"msg": "",
	"data": {}
}
```

# 登录管理

## 验证码登录

**接口地址**:`/smsLogin`

**请求方式**:`POST`

**请求数据类型**:`application/x-www-form-urlencoded,application/json`

**响应数据类型**:`*/*`

**接口描述**:<p>验证码登录</p>

**请求示例**:

```javascript
{
  "phone": "",
  "code": ""
}
```

**请求参数**:

| 参数名称          | 参数说明     | 请求类型 | 是否必须 | 数据类型     | schema       |
| ----------------- | ------------ | -------- | -------- | ------------ | ------------ |
| smsLoginForm      | SmsLoginForm | body     | true     | SmsLoginForm | SmsLoginForm |
| &emsp;&emsp;phone |              |          | true     | string       |              |
| &emsp;&emsp;code  |              |          | true     | string       |              |

**响应状态**:

| 状态码 | 说明 | schema       |
| ------ | ---- | ------------ |
| 200    | OK   | 通用返回对象 |

**响应参数**:

| 参数名称 | 参数说明 | 类型           | schema         |
| -------- | -------- | -------------- | -------------- |
| code     |          | integer(int32) | integer(int32) |
| msg      |          | string         |                |
| data     |          | object         |                |

**响应示例**:

```javascript
{
	"code": 0,
	"msg": "",
	"data": {}
}
```

## 发送短信

**接口地址**:`/sendSms`

**请求方式**:`GET`

**请求数据类型**:`application/x-www-form-urlencoded`

**响应数据类型**:`*/*`

**接口描述**:<p>发送短信</p>

**请求参数**:

| 参数名称 | 参数说明 | 请求类型 | 是否必须 | 数据类型 | schema |
| -------- | -------- | -------- | -------- | -------- | ------ |
| phone    | 手机号   | query    | true     | string   |        |

**响应状态**:

| 状态码 | 说明 | schema       |
| ------ | ---- | ------------ |
| 200    | OK   | 通用返回对象 |

**响应参数**:

| 参数名称 | 参数说明 | 类型           | schema         |
| -------- | -------- | -------------- | -------------- |
| code     |          | integer(int32) | integer(int32) |
| msg      |          | string         |                |
| data     |          | object         |                |

**响应示例**:

```javascript
{
	"code": 0,
	"msg": "",
	"data": {}
}
```

# ComfyUI 调用日志管理

## 分页查询 ComfyUI 调用日志

**接口地址**:`/comfyui/logs`

**请求方式**:`GET`

**请求数据类型**:`application/x-www-form-urlencoded`

**响应数据类型**:`*/*`

**接口描述**:

**请求参数**:

| 参数名称               | 参数说明                                            | 请求类型 | 是否必须 | 数据类型                    | schema                      |
| ---------------------- | --------------------------------------------------- | -------- | -------- | --------------------------- | --------------------------- |
| pageVo                 |                                                     | query    | true     | ComfyUI 调用日志分页查询 VO | ComfyUI 调用日志分页查询 VO |
| &emsp;&emsp;orderBy    | 排序字段{0:根据 example 的字段排序，1:根据耗时排序} |          | false    | integer(int32)              |                             |
| &emsp;&emsp;begin      | 开始时间                                            |          | false    | string(date-time)           |                             |
| &emsp;&emsp;end        | 结束时间                                            |          | false    | string(date-time)           |                             |
| &emsp;&emsp;pageNum    | 页码，从 1 开始                                     |          | true     | integer(int32)              |                             |
| &emsp;&emsp;pageSize   | 每页条数，最大值为 100                              |          | true     | integer(int32)              |                             |
| &emsp;&emsp;uid        | 用户唯一标识                                        |          | false    | string                      |                             |
| &emsp;&emsp;username   | 用户名                                              |          | false    | string                      |                             |
| &emsp;&emsp;nickname   | 用户昵称                                            |          | false    | string                      |                             |
| &emsp;&emsp;methodName | 方法名                                              |          | false    | string                      |                             |
| &emsp;&emsp;state      | 状态                                                |          | false    | string                      |                             |

**响应状态**:

| 状态码 | 说明 | schema       |
| ------ | ---- | ------------ |
| 200    | OK   | 通用返回对象 |

**响应参数**:

| 参数名称 | 参数说明 | 类型           | schema         |
| -------- | -------- | -------------- | -------------- |
| code     |          | integer(int32) | integer(int32) |
| msg      |          | string         |                |
| data     |          | object         |                |

**响应示例**:

```javascript
{
	"code": 0,
	"msg": "",
	"data": {}
}
```
