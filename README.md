# Online_Shopping_System_Group21
COMP3114/CSAI3124 Online Shopping System Project-----By Group21

A1: 用户注册	POST /api/auth/register	bcrypt加密 + JWT令牌	
A2: 访问权限	公开路由 vs 认证路由	JWT中间件验证	
A3: 商品列表	GET /api/products	分页查询 + 缩略图	
A4: 商品搜索	GET /api/products/search	LIKE模糊查询	
A5: 分页控制	GET /api/products?page=1&limit=10	page/limit参数	
A6: 商品详情	GET /api/products/:id	单条查询 + HTML描述	
A7: 添加商品	POST /api/cart	购物车表插入	
A8: 购物车列表	GET /api/cart	关联查询 + 计算总价	
A9: 修改数量	PUT /api/cart/:id	更新数量 + 验证	
A10: 移除商品	DELETE /api/cart/:id	删除记录	
A11: 创建订单	POST /api/orders	事务处理 + 清空购物车	