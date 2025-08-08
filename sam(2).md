# 图像分割接口文档

## 1. 接口基本信息

- 接口名称：图像分割

- 接口地址：/sam/segment

- 请求方式：POST

- 请求类型：application/x-www-form-urlencoded

- 功能描述：根据图片ID，自动获取图片并调用Python分割服务，返回掩码RLE信息及蒙版个数。

------

## 2. 请求参数

| 参数名  | 类型 | 是否必填 | 说明                           |
| :------ | :--- | :------- | :----------------------------- |
| imageId | Long | 是       | 图片ID（由前端上传图片后获得） |

请求示例：

http

Apply to SamService.j...

POST /sam/segment

Content-Type: application/x-www-form-urlencoded

imageId=123

------

## 3. 响应参数

- 响应体结构（SamSegmentResponse）：

json

Apply to SamService.j...

{

 "code": 200,

 "msg": "操作成功",

 "data": {

  "masks": [

   {

​    "rle": {

​     "counts": "RLE编码字符串",

​     "size": [1024, 1024]

​    },

​    "size": [1024, 1024]

   }

   *// ...更多掩码*

  ],

  "maskCount": 8

 }

}

### 字段说明

| 字段名        | 类型           | 说明                     |
| :------------ | :------------- | :----------------------- |
| code          | Integer        | 状态码，200表示成功      |
| msg           | String         | 提示信息                 |
| data          | Object         | 返回数据体               |
| └─ masks      | List<MaskInfo> | 掩码RLE及尺寸信息列表    |
| └─ maskCount  | Integer        | 分割得到的蒙版个数       |
| └─ masks.rle  | RleInfo        | COCO RLE格式掩码及尺寸   |
| └─ rle.counts | String         | RLE编码字符串            |
| └─ rle.size   | List<Integer>  | RLE尺寸 [height, width]  |
| └─ masks.size | List<Integer>  | 掩码尺寸 [height, width] |

------

## 4. 响应示例

json

Apply to SamService.j...

{

 "code": 200,

 "msg": "操作成功",

 "data": {

  "masks": [

   {

​    "rle": {

​     "counts": "Uff3<ao07K3N1O000010O0101N100...",

​     "size": [1024, 1024]

​    },

​    "size": [1024, 1024]

   }

  ],

  "maskCount": 8

 }

}

------

## 5. 前端处理建议

1. 接口调用

使用 POST 方式提交 imageId，获取分割结果。

1. 解析响应

- masks 为分割出的所有掩码，每个掩码包含COCO RLE编码和尺寸信息。

- maskCount 为分割得到的掩码（蒙版）总数，便于前端直接展示。

1. RLE解码

- 前端可用 coco-annotator/utils/rle.js 或 coco-mask-js 进行 RLE 解码，将 counts 还原为二值掩码数组，进行可视化或后续处理。

1. 可视化建议

- 可用 canvas 或图片叠加方式展示掩码。

- 支持多掩码分层显示、导出等功能。

------

## 6. 异常说明

| code | msg              | 说明                     |
| :--- | :--------------- | :----------------------- |
| 200  | 操作成功         | 分割成功                 |
| 404  | 图片不存在       | imageId无效或图片未找到  |
| 500  | 分割服务调用失败 | Python服务异常或网络错误 |

------

## 7. 备注

- masks 列表为空时，maskCount 也为0，表示未分割出有效掩码。