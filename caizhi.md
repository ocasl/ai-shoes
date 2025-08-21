## 上传材质

**接口地址**:`/material/upload`

**请求方式**:`POST`

**请求数据类型**:`application/x-www-form-urlencoded,application/json`

**响应数据类型**:`*/*`

**接口描述**:<p>上传新的材质文件</p>

**请求参数**:

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

## 删除材质

**接口地址**:`/material/{id}`

**请求方式**:`DELETE`

**请求数据类型**:`application/x-www-form-urlencoded`

**响应数据类型**:`*/*`

**接口描述**:<p>删除指定材质（逻辑删除）。管理员可以删除所有材质，普通用户只能删除自己的材质</p>

**请求参数**:

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
