# 路由与数据兼容契约

保留 /、/learning/、/learning/{chinese,math,english,science,computing}/、语文与数学下的 report.html / practice.html 及无后缀路径、/travel/hunan/、/games/twenty-four/index.html。旧 hash、直达、刷新、返回前进都必须测试。不能仅修改菜单而让收藏链接失效。

保持同域 localStorage；已知 key：yoyo-chinese-report-v1、yoyo-chinese-v1、yoyo-chinese-reward-v1、yoyo-chinese-writing-v1、yoyo-math-report-v1、yoyo-geometry-v1、yoyo-geometry-reward-v1、math24_adventure_v1。学习地图与旅游的实际 key 由迁移代码原样保留。禁止在 hydration 期间用空默认状态覆盖历史值；读取、解析、写入分别处理异常。已公开报告外的私人试卷和文件不得进入输出。

所有题目、评分、错题、奖励、作文、护照、导出与打印行为均为兼容契约。清理页面生命周期的监听和朗读队列，但不改变 iOS 首次用户激活策略。
