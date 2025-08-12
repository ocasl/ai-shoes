接口名称	接口路径	前端请求参数（必填项标★）	后端返回数据示例
自动配色	/image/zdps	★{
  "majorId": 0,
  "minorId": 0,
可选：prompt（string，关键词）	{"code":200,"msg":"操作成功","data":{"promptId":"xxx","clientId":"xxx","server":"server1"}}
线稿图	/image/xgt	★ imageId（int32，主图 ID）	通用返回结构，data 含线稿图相关数据
去水印	/image/qsy	（文档未明确具体参数，需结合实际场景补充）	通用返回结构，data 含去水印后图片数据
图片修复（蒙版）	/image/gene/xf	★ imageId（int32，主图 ID）
★ isMask（int32，是否为蒙版）	通用返回结构，data 含修复后图片数据
鞋底换面（蒙版）	/image/gene/xdhh	（文档未明确具体参数，需结合实际场景补充）	通用返回结构，data 含换面后图片数据
元素消除（蒙版）	/image/gene/xc	★ imageId（int32，主图 ID）
★ isMask（int32，是否为蒙版）	通用返回结构，data 含消除元素后图片数据
款式延伸（图加图 OK）	/image/gene/tstok	★ imageId（int32，主图 ID）
★ loreName（string，模型名称）
★ denoise（float，噪点强度，1-10）	通用返回结构，data 含延伸后款式图片数据
款式融合（图加图无锁）	/image/gene/tjtws	★ loreName（string，模型名称）
★ majorId（int32，主图 ID）
★ minorId（int32，附图 ID）
★ majorStrength（double，主图强度，0-10）
★ minorStrength（double，附图强度，0-10）	通用返回结构，data 含融合后图片数据
款式融合（主体加强）	/image/gene/strhzxs	同 “款式融合”+★ structuralStrength（double，结构强度，0-10）	通用返回结构，data 含主体加强后的融合图片数据
文字创款（Lore 文生图）	/image/gene/lorewst	★ prompt（string，关键词）
★ loreName（string，模型名称）	通用返回结构，data 含文字生成的款式图片数据

局部修改（蒙版）	/image/gene/jbch	★ majorId（int32，主图 ID）
★ minorId（int32，附图 ID）
★ isMask（int32，蒙蔽状态：0 - 不蒙蔽 / 1 - 主图蒙蔽 / 2 - 二图蒙蔽）
可选：prompt（string，关键词）	通用返回结构，data 含局部修改后图片数据
高清放大	/image/gene/gqfd	★ imageId（int32，主图 ID）	通用返回结构，data 含放大后高清图片数据
请求等待结果	/image/request（GET）	★ pi（string，查询参数）
★ server（string，查询参数）
可选：Authorization头	通用返回结构，data 含请求结果状态及最终数据（如生成完成的图片信息）