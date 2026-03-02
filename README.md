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

A12: 订单列表	GET /api/orders	按购买日期倒序 + 分页	
A13: 订单详情	GET /api/orders/:orderId	订单项 + 配送地址 + 状态	
A14: 管理端浏览商品	GET /api/admin/products	分页 + 按名称/ID子串搜索	
A15: 商品ID搜索	GET /api/admin/products?product_id=	系统生成ID + 子串模糊匹配	
A16: 新增商品	POST /api/admin/products	name/price/缩略图/描述	
A17: 编辑商品	PUT /api/admin/products/:id	更新商品信息	
A18: 禁用/启用商品	PATCH /api/admin/products/:id/disable|enable	前台隐藏/展示	
A19: 管理端订单列表	GET /api/admin/orders	全部订单 + 客户名 + 按日期倒序	
A20: 管理端订单详情	GET /api/admin/orders/:orderId	订单项明细（商品名/数量/单价/小计）	



如何使用：
1.在后端开启终端输入以下指令
cd d:\aaaagit\Online_Shopping_System_Group21\backend   
node server.js

2.在前端开启终端输入以下指令
cd d:\aaaagit\Online_Shopping_System_Group21\frontend\cart
npm install      
npm run serve
3.网站在以下两个网址运行
  App running at:
  - Local:   http://localhost:8080/ 
  - Network: http://192.168.1.108:8080/

