# 模块边界约束

## 分层规则

- 皮肤层（`pages/widgets/features/ui`）只处理展示与用户交互，不直接访问 HTTP 或存储。
- 逻辑层（`features/*/model`）编排业务流程，只通过 repository/storage 接口读写数据。
- 数据层（`entities/*/api`、`entities/*/storage`、`services/*`）负责外部系统对接与持久化。

## 依赖方向

- 允许：`UI -> Logic -> Data`
- 禁止：`Data -> UI`
- 禁止：`shared` 引入业务实体（`resume`）实现细节
- 禁止：跨层级深引用，必须走模块 `index.ts` 暴露入口

## 命名与职责

- 一个文件只聚焦一个职责（controller/service/store/usecase）。
- 输入输出结构必须对应 `packages/types` 契约定义。
- 接口返回统一响应包（`code/message/traceId/data`）。
