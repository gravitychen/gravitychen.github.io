<template>
  <div class="math-table-container">
    <div class="header">
      <h2>📊 数学概念表格</h2>
      <div class="controls">
        <button @click="showAddCategoryDialog = true" class="add-category-btn">
          ➕ 添加学科
        </button>
        <button :disabled="isLoading" @click="runAllTests" class="run-btn">
          {{ isLoading ? '引擎加载中...' : '运行所有代码' }}
        </button>
        <span class="status">{{ statusMsg }}</span>
      </div>
    </div>

    <!-- 添加学科对话框 -->
    <div v-if="showAddCategoryDialog" class="dialog-overlay" @click="showAddCategoryDialog = false">
      <div class="dialog-content" @click.stop>
        <h3>添加新学科</h3>
        <div class="form-group">
          <label>学科名称：</label>
          <input 
            v-model="newCategoryName" 
            type="text" 
            placeholder="例如：线性代数"
            class="form-input"
            @keyup.enter="addCategory"
          />
        </div>
        <div class="dialog-actions">
          <button @click="addCategory" class="confirm-btn" :disabled="!newCategoryName.trim()">
            确认添加
          </button>
          <button @click="cancelAddCategory" class="cancel-btn">
            取消
          </button>
        </div>
      </div>
    </div>

    <div class="categories-container">
      <div v-for="category in categories" :key="category.name" class="category-section">
        <div class="category-header">
          <div class="category-header-left" @click="toggleCategory(category.name)">
            <span class="category-icon">{{ category.expanded ? '▼' : '▶' }}</span>
            <h3 class="category-title">{{ category.name }}</h3>
            <span class="category-count">({{ category.data.length }} 个概念)</span>
          </div>
          <div class="category-header-right">
            <button @click.stop="showAddItemDialogFunc(category.name)" class="add-item-btn" title="添加概念">
              ➕
            </button>
            <button @click.stop="confirmDeleteCategory(category.name)" class="delete-category-btn" title="删除学科">
              🗑️
            </button>
          </div>
        </div>
        <div v-show="category.expanded" class="table-wrapper">
          <table class="tg">
            <thead>
              <tr>
                <th class="tg-0pky">概念 (Concept / 概念)</th>
                <th class="tg-0pky">人话解释</th>
                <th class="tg-g6kh">专业解释（公式、符号及其特性）</th>
                <th class="tg-0pky">1D 生活例子和使用场景</th>
                <th class="tg-0pky">1D 生活例子 python 代码</th>
                <th class="tg-0pky">运行python代码后的输出</th>
                <th class="tg-0pky">2D 图像处理例子和使用场景</th>
                <th class="tg-0pky">2D python代码实现</th>
                <th class="tg-0pky">运行python代码后的输出</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in category.data" :key="index">
                <td class="tg-0pky concept-cell">
                  <div class="concept-cell-content">
                    <span v-html="item.concept"></span>
                    <button @click="deleteItem(category.name, index)" class="delete-item-btn" title="删除概念">
                      🗑️
                    </button>
                  </div>
                </td>
                <td class="tg-0pky simple-explain">{{ item.simpleExplain }}</td>
                <td class="tg-g6kh math-formula">
                  <div 
                    :ref="el => setFormulaRef(el, category.name, index)" 
                    class="formula-container"
                    v-html="item.professionalExplain"
                  ></div>
                </td>
                <td class="tg-0pky example-scenario-1d">
                  <div class="example-scenario-content">
                    <div v-if="item.example1d" class="example-part">
                      <strong>例子：</strong>{{ item.example1d }}
                    </div>
                    <div v-if="item.scenario1d" class="scenario-part">
                      <strong>使用场景：</strong>{{ item.scenario1d }}
                    </div>
                  </div>
                </td>
                <td class="tg-0pky code-cell">
                  <textarea 
                    v-model="item.code1d" 
                    @input="debouncedSave(category.name)"
                    class="code-editor" 
                    placeholder="输入1D Python代码...">
                  </textarea>
                </td>
                <td class="tg-0pky output-cell" :class="{ 'has-val': item.output1d, 'has-error': item.hasError1d }">
                  {{ item.output1d || '等待运行...' }}
                </td>
                <td class="tg-0pky example-scenario-2d">
                  <div class="example-scenario-content">
                    <div v-if="item.example2d" class="example-part">
                      <strong>例子：</strong>{{ item.example2d }}
                    </div>
                    <div v-if="item.scenario2d" class="scenario-part">
                      <strong>使用场景：</strong>{{ item.scenario2d }}
                    </div>
                  </div>
                </td>
                <td class="tg-0pky code-cell">
                  <textarea 
                    v-model="item.code2d" 
                    @input="debouncedSave(category.name)"
                    class="code-editor" 
                    placeholder="输入2D Python代码...">
                  </textarea>
                </td>
                <td class="tg-0pky output-cell" :class="{ 'has-val': item.output2d, 'has-error': item.hasError2d }">
                  {{ item.output2d || '等待运行...' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 添加概念对话框 -->
    <div v-if="showAddItemDialog" class="dialog-overlay" @click="showAddItemDialog = false">
      <div class="dialog-content large-dialog" @click.stop>
        <h3>添加新概念到「{{ currentCategoryName }}」</h3>
        <div class="form-group">
          <label>概念名称：</label>
          <textarea 
            v-model="newItem.concept" 
            class="form-textarea"
            rows="2"
            placeholder="例如：随机变量<br>確率変数<br>(かくりつへんすう)<br>Random Var"
          ></textarea>
        </div>
        <div class="form-group">
          <label>人话解释：</label>
          <textarea 
            v-model="newItem.simpleExplain" 
            class="form-textarea"
            rows="2"
            placeholder='例如：不是确定的值，而是用数字记录"不确定事件"的规则。'
          ></textarea>
        </div>
        <div class="form-group">
          <label>专业解释（公式、符号及其特性）：</label>
          <textarea 
            v-model="newItem.professionalExplain" 
            class="form-textarea"
            rows="3"
            placeholder="例如：公式： $X: \\Omega \\to \\mathbb{R}$ <br>符号特性： <br>1. $\\Omega$ 是所有可能（如室温范围）。<br>2. $X$ 的取值具有随机分布。"
          ></textarea>
        </div>
        <div class="form-group">
          <label>1D 生活例子和使用场景：</label>
          <div class="example-scenario-group">
            <div class="form-subgroup">
              <label class="sub-label">生活例子：</label>
              <input v-model="newItem.example1d" type="text" class="form-input" placeholder="例如：室温" />
            </div>
            <div class="form-subgroup">
              <label class="sub-label">使用场景：</label>
              <textarea 
                v-model="newItem.scenario1d" 
                class="form-textarea"
                rows="2"
                placeholder="描述使用场景..."
              ></textarea>
            </div>
          </div>
        </div>
        <div class="form-group">
          <label>2D 图像处理例子和使用场景：</label>
          <div class="example-scenario-group">
            <div class="form-subgroup">
              <label class="sub-label">图像处理例子：</label>
              <input v-model="newItem.example2d" type="text" class="form-input" placeholder="例如：像素亮度" />
            </div>
            <div class="form-subgroup">
              <label class="sub-label">使用场景：</label>
              <textarea 
                v-model="newItem.scenario2d" 
                class="form-textarea"
                rows="2"
                placeholder="描述使用场景..."
              ></textarea>
            </div>
          </div>
        </div>
        <div class="form-group">
          <label>1D Python 代码：</label>
          <textarea 
            v-model="newItem.code1d" 
            class="form-textarea code-textarea"
            rows="3"
            placeholder="例如：import numpy as np&#10;temp_1d = np.random.normal(25, 2, 3)&#10;print(f&quot;1D室温: {temp_1d.round(2)}&quot;)"
          ></textarea>
        </div>
        <div class="form-group">
          <label>2D Python 代码：</label>
          <textarea 
            v-model="newItem.code2d" 
            class="form-textarea code-textarea"
            rows="3"
            placeholder="例如：import numpy as np&#10;pixel_2d = np.random.normal(128, 20, (3, 3))&#10;print(f&quot;2D像素亮度:\\n{pixel_2d.round(0)}&quot;)"
          ></textarea>
        </div>
        <div class="dialog-actions">
          <button @click="confirmAddItem" class="confirm-btn" :disabled="!canAddItem">
            确认添加
          </button>
          <button @click="cancelAddItem" class="cancel-btn">
            取消
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, nextTick, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDataStore } from '../stores/dataStore'

export default {
  name: 'MathTable',
  setup() {
    const router = useRouter()
    const dataStore = useDataStore()
    
    // 默认概率论数据（用于初始化）
    const defaultProbabilityData = [
      {
        concept: '随机变量<br>確率変数<br>(かくりつへんすう)<br>Random Var',
        simpleExplain: '不是确定的值，而是用数字记录"不确定事件"的规则。',
        professionalExplain: '公式： $X: \\Omega \\to \\mathbb{R}$ <br>符号特性： <br>1. $\\Omega$ 是所有可能（如室温范围）。<br>2. $X$ 的取值具有随机分布。',
        example1d: '室温',
        scenario1d: '使用场景：测量CCD工作温度时，需要监控室温变化。室温受环境因素影响，不是固定值，需要用随机变量来描述其不确定性。',
        code1d: 'import numpy as np\ntemp_1d = np.random.normal(25, 2, 3)\nprint(f"1D室温: {temp_1d.round(2)}")',
        output1d: '',
        hasError1d: false,
        example2d: '像素亮度',
        scenario2d: '使用场景：在图像处理中，每个像素的亮度值受光照、噪声等因素影响，呈现随机性。需要建立像素亮度的随机变量模型来分析和处理图像。',
        code2d: 'import numpy as np\npixel_2d = np.random.normal(128, 20, (3, 3))\nprint(f"2D像素亮度:\\n{pixel_2d.round(0)}")',
        output2d: '',
        hasError2d: false,
        renderedFormula: ''
      },
      {
        concept: '期望<br>期待値<br>(きたいち)<br>Expectation',
        simpleExplain: '长期来看的"平均水平"，代表了事物的中心位置。',
        professionalExplain: '公式： $E[X] = \\int x f(x) dx$ <br>符号特性： <br>1. 线性： $E[aX+b] = aE[X]+b$。<br>2. 加性： 总期望等于各个部分期望之和。',
        example1d: '平均身高',
        scenario1d: '使用场景：在人口统计或医学研究中，需要了解某个群体的平均身高。通过计算期望值，可以预测该群体的典型身高水平，用于制定标准或进行健康评估。',
        code1d: 'import numpy as np\nheights = [170, 175, 180, 165]\nprint(f"平均身高: {np.mean(heights)}")',
        output1d: '',
        hasError1d: false,
        example2d: '多帧降噪',
        scenario2d: '使用场景：在低光环境下拍摄视频时，单帧图像噪声很大。通过对多帧图像求期望（平均），可以显著降低随机噪声，提高图像质量。这是视频降噪算法的核心原理。',
        code2d: 'import numpy as np\nframes = np.random.normal(100, 10, (5, 10, 10))\nmean_frame = np.mean(frames, axis=0)\nprint(f"降噪后均值: {np.mean(mean_frame):.2f}")',
        output2d: '',
        hasError2d: false,
        renderedFormula: ''
      },
      {
        concept: '方差<br>分散<br>(ぶんさん)<br>Variance',
        simpleExplain: '衡量数据"稳不稳定"。方差大说明起伏大，方差小说明很稳。',
        professionalExplain: '公式： $Var(X) = E[X^2] - (E[X])^2$ <br>符号特性： <br>1. 非负： 波动程度不会是负数。<br>2. 平方缩放： $Var(aX) = a^2 Var(X)$。',
        example1d: '空调波动',
        scenario1d: '使用场景：评估空调系统的稳定性。如果温度方差大，说明空调控制不稳定，需要调整或维修。方差小则说明温度控制良好，适合精密设备运行。',
        code1d: 'import numpy as np\ntemps = [24, 25, 24, 26, 25]\nprint(f"温度方差: {np.var(temps):.3f}")',
        output1d: '',
        hasError1d: false,
        example2d: '图像纹理',
        scenario2d: '使用场景：在图像分析中，通过计算局部区域的方差可以识别纹理特征。方差大的区域可能是边缘或纹理丰富的区域，方差小的区域可能是平滑的背景。用于图像分割和特征提取。',
        code2d: 'import numpy as np\nimage = np.random.normal(128, 30, (10, 10))\nprint(f"图像方差: {np.var(image):.2f}")',
        output2d: '',
        hasError2d: false,
        renderedFormula: ''
      },
      {
        concept: '标准差<br>標準偏差<br>(ひょうじゅんへんさ)<br>Std Deviation',
        simpleExplain: '方差的"还原版"。Scale单位和原数据一样，方便我们直观理解误差。',
        professionalExplain: '公式： $\\sigma = \\sqrt{Var(X)}$ <br>符号特性： <br>1. 物理含义：偏离中心的平均距离。<br>2. 单位与原始数据（米、度、像素）一致。',
        example1d: '温度波动',
        scenario1d: '使用场景：在质量控制中，需要知道温度的标准差来判断测量精度。如果标准差为2度，意味着大部分测量值会在平均值±2度范围内，便于设定合理的容差范围。',
        code1d: 'import numpy as np\ndata = [10, 12, 14, 16, 18]\nprint(f"标准差: {np.std(data):.2f}")',
        output1d: '',
        hasError1d: false,
        example2d: '图像对比度',
        scenario2d: '使用场景：在图像增强中，标准差反映图像的对比度。标准差大的图像对比度高、细节丰富；标准差小的图像对比度低、可能偏灰。用于自动调整图像亮度和对比度。',
        code2d: 'import numpy as np\nimage = np.random.normal(100, 15, (8, 8))\nprint(f"图像标准差: {np.std(image):.2f}")',
        output2d: '',
        hasError2d: false,
        renderedFormula: ''
      },
      {
        concept: '协方差<br>共分散<br>(きょうぶんさん)<br>Covariance',
        simpleExplain: '衡量两个事物是否"步调一致"。',
        professionalExplain: '公式： $Cov(X,Y) = E[(X-E_X)(Y-E_Y)]$ <br>符号特性： <br>1. 正值代表同向变化，负值代表反向变化。<br>2. 独立变量协方差为 0。',
        example1d: '身高体重',
        scenario1d: '使用场景：在健康研究中，需要了解身高和体重的关系。如果协方差为正，说明身高增加时体重也倾向于增加，可以用于预测和健康评估。',
        code1d: 'import numpy as np\nx = [1, 2, 3, 4, 5]\ny = [2, 4, 6, 8, 10]\nprint(f"协方差: {np.cov(x, y)[0,1]:.2f}")',
        output1d: '',
        hasError1d: false,
        example2d: 'RGB通道',
        scenario2d: '使用场景：在图像处理中，分析RGB通道之间的相关性。如果R和G通道协方差大，说明它们在图像中变化趋势一致，可能来自同一光源或物体，用于颜色校正和图像分析。',
        code2d: 'import numpy as np\nr = np.random.normal(100, 10, (5, 5))\ng = r + np.random.normal(0, 2, (5, 5))\nprint(f"R-G协方差: {np.cov(r.flatten(), g.flatten())[0,1]:.2f}")',
        output2d: '',
        hasError2d: false,
        renderedFormula: ''
      },
      {
        concept: '相关系数<br>相関係数<br>(そうかんけいすう)<br>Correlation',
        simpleExplain: '剔除了大小影响的"纯粹相关性"。',
        professionalExplain: '公式： $\\rho = \\frac{Cov(X,Y)}{\\sigma_X \\sigma_Y}$ <br>符号特性： <br>1. 范围 $[-1, 1]$。<br>2. $\\rho=1$ 代表完全同步，$\\rho=0$ 代表没关系。',
        example1d: '身高体重相关性',
        scenario1d: '使用场景：在医学研究中，需要量化身高和体重的相关强度。相关系数不受单位影响，可以比较不同研究的结果。接近1表示强正相关，用于建立预测模型和健康标准。',
        code1d: 'import numpy as np\nx = np.array([170, 175, 180, 165, 172])\ny = np.array([60, 65, 70, 58, 63])\ncorr = np.corrcoef(x, y)[0, 1]\nprint(f"相关系数: {corr:.3f}")',
        output1d: '',
        hasError1d: false,
        example2d: '图像通道相关性',
        scenario2d: '使用场景：在图像压缩和去噪中，通过分析RGB通道的相关系数，可以判断图像的颜色分布特征。高相关性说明可以共享编码信息，用于提高压缩效率。',
        code2d: 'import numpy as np\nr = np.random.normal(100, 10, 25)\ng = r * 0.8 + np.random.normal(0, 5, 25)\ncorr = np.corrcoef(r, g)[0,1]\nprint(f"R-G相关系数: {corr:.3f}")',
        output2d: '',
        hasError2d: false,
        renderedFormula: ''
      },
      {
        concept: '条件概率<br>条件付き確率<br>(じょうけんつきかくりつ)<br>Conditional',
        simpleExplain: '"已知 A 发生，推测 B 发生的概率"。锁定背景，减少猜测。',
        professionalExplain: '公式： $P(B \\vert A) = \\frac{P(AB)}{P(A)}$ <br>符号特性： <br>1. 缩小了决策范围（样本空间）。<br>2. 是逻辑推理的核心。',
        example1d: '下雨后温度',
        scenario1d: '使用场景：在气象预测中，已知今天下雨，需要预测温度。条件概率帮助我们基于已知信息（下雨）来更准确地预测温度，而不是使用无条件概率，提高预测精度。',
        code1d: 'import numpy as np\n# 模拟条件概率\nrain = np.random.choice([0, 1], 100, p=[0.7, 0.3])\ntemp = np.where(rain==1, np.random.normal(20, 2, 100), np.random.normal(25, 3, 100))\nprint(f"下雨时平均温度: {np.mean(temp[rain==1]):.2f}")',
        output1d: '',
        hasError1d: false,
        example2d: '边缘检测',
        scenario2d: '使用场景：在图像处理中，已知某个像素是边缘（梯度大），需要判断它属于物体的概率。条件概率帮助我们在已知边缘信息的情况下，更准确地识别物体边界，用于目标检测和分割。',
        code2d: 'import numpy as np\nimage = np.random.randint(0, 256, (10, 10))\nedge = np.abs(np.diff(image, axis=1)) > 30\nprint(f"边缘像素比例: {np.mean(edge):.3f}")',
        output2d: '',
        hasError2d: false,
        renderedFormula: ''
      },
      {
        concept: '全概率公式<br>全確率の定理<br>(ぜんかくりつのていり)<br>Law of Total Probability',
        simpleExplain: '分而治之。如果想知道一个事件发生的总概率，就把它在各种可能情况（原因）下的概率分别算出来，再加权求和。',
        professionalExplain: '公式： $P(A) = \\sum_{i} P(A \\vert B_i) P(B_i)$ <br>符号特性： <br>1. $\\{B_i\\}$ 必须是互斥且完备的（即涵盖所有可能的原因）。<br>2. 它将"局部条件概率"转化为"全局概率"。',
        example1d: '多天气情况',
        scenario1d: '使用场景：在长期温度预测中，需要考虑所有可能的天气情况（晴天、雨天、阴天）。全概率公式帮助我们综合各种天气条件下的温度概率，得到整体的温度期望，用于制定长期计划。',
        code1d: 'import numpy as np\n# 全概率：晴天、雨天、阴天的加权平均\nweather_probs = [0.5, 0.3, 0.2]\ntemp_probs = [25, 20, 22]\ntotal_temp = sum(p * t for p, t in zip(weather_probs, temp_probs))\nprint(f"期望温度: {total_temp:.1f}")',
        output1d: '',
        hasError1d: false,
        example2d: '多区域统计',
        scenario2d: '使用场景：在图像分析中，图像可能包含多个区域（前景、背景、边缘等）。全概率公式帮助我们综合各个区域的统计特征，得到整张图像的整体特征，用于图像分类和识别。',
        code2d: 'import numpy as np\nregions = [np.random.normal(100, 10, 20) for _ in range(3)]\nweights = [0.4, 0.3, 0.3]\ntotal_mean = sum(w * np.mean(r) for w, r in zip(weights, regions))\nprint(f"全区域均值: {total_mean:.2f}")',
        output2d: '',
        hasError2d: false,
        renderedFormula: ''
      },
      {
        concept: '大数定律<br>大数の法則<br>(たいすうのほうそく)<br>LLN',
        simpleExplain: '实验次数越多，平均值就越趋向于"天意"（期望值）。',
        professionalExplain: '公式： $\\bar{X}_n \\to E[X]$ <br>符号特性： <br>1. 样本均值具有收敛性。<br>2. 只有样本量 $n$ 够大，结论才可靠。',
        example1d: '多次测量',
        scenario1d: '使用场景：在精密测量中，单次测量可能有误差。通过多次测量并求平均，大数定律保证平均值会收敛到真实值。这是提高测量精度的标准方法，用于科学实验和质量控制。',
        code1d: 'import numpy as np\nsamples = [10, 100, 1000, 10000]\nfor n in samples:\n    data = np.random.normal(25, 2, n)\n    print(f"n={n}: 均值={np.mean(data):.3f}")',
        output1d: '',
        hasError1d: false,
        example2d: '多帧平均',
        scenario2d: '使用场景：在低光摄影中，单帧图像噪声很大。通过拍摄多帧并求平均，大数定律保证平均图像会收敛到真实场景，显著降低噪声。这是天文摄影和显微镜成像的常用技术。',
        code2d: 'import numpy as np\nframes = [np.random.normal(100, 10, (10, 10)) for _ in range(100)]\nmean_frame = np.mean(frames, axis=0)\nprint(f"100帧平均后均值: {np.mean(mean_frame):.2f}")',
        output2d: '',
        hasError2d: false,
        renderedFormula: ''
      },
      {
        concept: '中心极限定理<br>中心極限定理<br>(ちゅうしんきょくげんていり)<br>CLT',
        simpleExplain: '无论原始分布多奇怪，大量微小独立误差叠加后，都是正态分布。',
        professionalExplain: '公式： $\\sum X_i \\sim N(n\\mu, n\\sigma^2)$ <br>符号特性： <br>1. 解释了为什么万物皆可"高斯"。<br>2. 计算区间估计（误差范围）的基石。',
        example1d: '误差叠加',
        scenario1d: '使用场景：在测量系统中，每个环节都有误差（传感器误差、传输误差、处理误差等）。中心极限定理说明，即使单个误差分布未知，多个误差叠加后总误差会接近正态分布，便于进行误差分析和置信区间估计。',
        code1d: 'import numpy as np\n# 多个均匀分布叠加\nsamples = [np.sum(np.random.uniform(0, 1, 30)) for _ in range(1000)]\nprint(f"均值: {np.mean(samples):.3f}, 标准差: {np.std(samples):.3f}")',
        output1d: '',
        hasError1d: false,
        example2d: '多区域叠加',
        scenario2d: '使用场景：在图像合成中，多个区域的像素值叠加形成最终图像。中心极限定理说明，即使单个区域分布不规则，叠加后的整体分布会接近正态，便于进行图像质量评估和噪声建模。',
        code2d: 'import numpy as np\n# 多个区域叠加\nregions = [np.random.uniform(50, 150, (5, 5)) for _ in range(20)]\ncombined = np.sum(regions, axis=0)\nprint(f"叠加后均值: {np.mean(combined):.1f}, 标准差: {np.std(combined):.1f}")',
        output2d: '',
        hasError2d: false,
        renderedFormula: ''
      }
    ]

    // 优化理论数据（示例，可以后续添加）
    const defaultOptimizationData = [
      // 这里可以添加优化理论的概念
    ]

    // 从 dataStore 加载数据并转换为 categories 格式
    const loadCategoriesFromStore = () => {
      const mathConcepts = dataStore.mathConcepts || []
      
      // 将 mathConcepts 转换为 categories 格式
      // mathConcepts 中每个文档代表一个 category，包含 categoryName 和 items 数组
      const categoryMap = new Map()
      
      mathConcepts.forEach(conceptDoc => {
        const categoryName = conceptDoc.categoryName || '未分类'
        const items = conceptDoc.items || []
        
        categoryMap.set(categoryName, {
          name: categoryName,
          data: ref(items.map(item => ({
            ...item,
            output1d: item.output1d || '',
            hasError1d: item.hasError1d || false,
            output2d: item.output2d || '',
            hasError2d: item.hasError2d || false,
            renderedFormula: ''
          }))),
          expanded: categoryName === '概率论', // 默认展开概率论
          id: conceptDoc.id // 保存文档 ID 以便更新
        })
      })
      
      // 如果没有数据，使用默认数据并初始化到云端
      if (categoryMap.size === 0) {
        const probabilityCategory = {
          name: '概率论',
          data: ref([...defaultProbabilityData]),
          expanded: true,
          id: null
        }
        const optimizationCategory = {
          name: '优化理论',
          data: ref([...defaultOptimizationData]),
          expanded: false,
          id: null
        }
        
        categoryMap.set('概率论', probabilityCategory)
        categoryMap.set('优化理论', optimizationCategory)
        
        // 如果在线，初始化数据到云端
        if (dataStore.isOnline && dataStore.currentLanguage === 'math') {
          initCategoriesToCloud([probabilityCategory, optimizationCategory])
        }
      }
      
      return Array.from(categoryMap.values())
    }

    // 初始化 categories 到云端
    const initCategoriesToCloud = async (categories) => {
      for (const category of categories) {
        try {
          const conceptDoc = {
            categoryName: category.name,
            items: category.data.value.map(item => ({
              ...item,
              // 移除临时字段
              output1d: '',
              hasError1d: false,
              output2d: '',
              hasError2d: false,
              renderedFormula: ''
            }))
          }
          const newDoc = await dataStore.addMathConcept(conceptDoc)
          category.id = newDoc.id
        } catch (error) {
          console.error('初始化分类到云端失败:', category.name, error)
        }
      }
    }

    // 分类数据结构
    const categories = ref(loadCategoriesFromStore())

    // 添加/删除学科和概念相关的状态
    const showAddCategoryDialog = ref(false)
    const newCategoryName = ref('')
    const showAddItemDialog = ref(false)
    const currentCategoryName = ref('')
    const newItem = ref({
      concept: '',
      simpleExplain: '',
      professionalExplain: '',
      example1d: '',
      scenario1d: '',
      code1d: '',
      example2d: '',
      scenario2d: '',
      code2d: '',
      output1d: '',
      hasError1d: false,
      output2d: '',
      hasError2d: false,
      renderedFormula: ''
    })

    // 检查是否可以添加概念
    const canAddItem = computed(() => {
      return newItem.value.concept.trim() && newItem.value.simpleExplain.trim()
    })

    // 监听 dataStore.mathConcepts 的变化
    watch(() => dataStore.mathConcepts, (newConcepts) => {
      console.log('MathTable: mathConcepts 数据更新', newConcepts?.length)
      categories.value = loadCategoriesFromStore()
      // 数据更新后，重新渲染公式
      nextTick(() => {
        renderMathFormulas()
      })
    }, { deep: true })

    // 保存整个 category 到 dataStore
    const saveCategory = async (categoryName) => {
      if (!dataStore.isOnline) {
        console.warn('未连接到云端，无法保存数据')
        return
      }

      if (dataStore.currentLanguage !== 'math') {
        console.warn('当前语言不是 math，无法保存数学概念')
        return
      }

      try {
        // 查找对应的 category
        const category = categories.value.find(cat => cat.name === categoryName)
        if (!category) {
          console.error('找不到分类:', categoryName)
          return
        }

        // 构建要保存的数据
        const conceptDoc = {
          categoryName: categoryName,
          items: category.data.value.map(item => ({
            ...item,
            // 移除临时字段
            output1d: '',
            hasError1d: false,
            output2d: '',
            hasError2d: false,
            renderedFormula: ''
          }))
        }

        // 如果 category 有 id，说明已存在，更新；否则创建新文档
        if (category.id) {
          await dataStore.updateMathConcept(category.id, conceptDoc)
        } else {
          // 创建新文档
          const newDoc = await dataStore.addMathConcept(conceptDoc)
          category.id = newDoc.id
        }
      } catch (error) {
        console.error('保存数学分类失败:', error)
      }
    }

    // 监听数据变化并自动保存（防抖）
    const saveTimers = new Map()
    const debouncedSave = (categoryName) => {
      if (saveTimers.has(categoryName)) {
        clearTimeout(saveTimers.get(categoryName))
      }
      const timer = setTimeout(() => {
        saveCategory(categoryName)
        saveTimers.delete(categoryName)
      }, 2000) // 2秒后保存
      saveTimers.set(categoryName, timer)
    }

    // 切换分类展开/收缩
    const toggleCategory = async (categoryName) => {
      const category = categories.value.find(cat => cat.name === categoryName)
      if (category) {
        category.expanded = !category.expanded
        // 如果展开，等待 DOM 更新后渲染该分类的公式
        if (category.expanded) {
          await nextTick()
          // 再等待一帧，确保 ref 已设置
          await new Promise(resolve => setTimeout(resolve, 50))
          await renderCategoryFormulas(category)
        }
      }
    }

    // 存储公式 DOM 引用：{ categoryName_index: element }
    const formulaRefs = new Map()

    // 设置公式引用
    const setFormulaRef = (el, categoryName, itemIndex) => {
      if (el) {
        const key = `${categoryName}_${itemIndex}`
        formulaRefs.set(key, el)
      }
    }

    // 检查 KaTeX 是否已加载
    const waitForKaTeX = () => {
      return new Promise((resolve) => {
        const checkKaTeX = () => {
          if (typeof window.katex !== 'undefined' && window.katex.render) {
            console.log('✅ KaTeX 已加载，render 函数可用:', typeof window.katex.render)
            resolve()
          } else {
            console.log('⏳ 等待 KaTeX 加载...', {
              katex: typeof window.katex,
              render: typeof window.katex?.render
            })
            setTimeout(checkKaTeX, 100)
          }
        }
        checkKaTeX()
      })
    }

    // 渲染单个分类的数学公式（方案A：直接操作 DOM）
    const renderCategoryFormulas = async (category) => {
      try {
        console.log(`🔄 开始渲染分类: ${category.name}`, {
          categoryName: category.name,
          hasData: !!category.data,
          isRef: category.data?.value !== undefined,
          dataType: Array.isArray(category.data) ? 'array' : (category.data?.value ? 'ref' : 'unknown'),
          dataLength: Array.isArray(category.data) ? category.data.length : category.data?.value?.length
        })
        
        // 获取实际的数据数组（可能是 ref 或普通数组）
        const dataArray = Array.isArray(category.data) ? category.data : category.data?.value
        
        if (!category || !dataArray || !Array.isArray(dataArray)) {
          console.error('❌ 分类数据无效:', {
            category,
            dataArray,
            isArray: Array.isArray(dataArray)
          })
          return
        }
        
        await waitForKaTeX()
        await nextTick() // 确保 DOM 已 ready

        dataArray.forEach((item, itemIndex) => {
          try {
            const key = `${category.name}_${itemIndex}`
            const formulaEl = formulaRefs.get(key)
            
            console.log(`📋 处理第 ${itemIndex + 1} 项，key: ${key}`, {
              hasElement: !!formulaEl,
              hasKatex: formulaEl?.querySelector('.katex') ? true : false,
              textContent: formulaEl?.textContent?.substring(0, 50) || 'empty',
              hasProfessionalExplain: !!item.professionalExplain
            })
            
            if (!formulaEl) {
              console.log(`⏳ DOM 元素未准备好，延迟渲染: ${key}`)
              // DOM 元素还未准备好，延迟渲染
              setTimeout(() => {
                try {
                  const el = formulaRefs.get(key)
                  if (el) {
                    console.log(`🔄 延迟渲染开始: ${key}`)
                    renderSingleFormula(el, item.professionalExplain)
                  } else {
                    console.warn(`❌ 延迟后仍未找到元素: ${key}`)
                  }
                } catch (err) {
                  console.error(`❌ 延迟渲染出错: ${key}`, err)
                }
              }, 200)
              return
            }

            // 如果已经渲染过，跳过（检查是否有 katex 子元素）
            if (formulaEl.querySelector('.katex')) {
              console.log(`✅ 已渲染过，跳过: ${key}`)
              return
            }
            
            if (!item.professionalExplain) {
              console.warn(`⚠️ 项目没有 professionalExplain: ${key}`)
              return
            }
            
            console.log(`🎨 开始渲染公式: ${key}`)
            renderSingleFormula(formulaEl, item.professionalExplain)
          } catch (itemError) {
            console.error(`❌ 处理项目时出错 (${itemIndex}):`, itemError, {
              errorMessage: itemError?.message,
              errorStack: itemError?.stack,
              item: item
            })
          }
        })
      } catch (error) {
        console.error('❌ renderCategoryFormulas 错误:', {
          error: error,
          errorMessage: error?.message,
          errorStack: error?.stack,
          errorName: error?.name,
          category: category?.name,
          categoryData: category?.data
        })
      }
    }

    // 渲染单个公式单元格的内容
    const renderSingleFormula = (formulaEl, text) => {
      console.log('🎯 renderSingleFormula 被调用', {
        element: formulaEl,
        textLength: text.length,
        textPreview: text.substring(0, 100)
      })
      
      try {
        // 匹配 $...$ 格式的公式
        const formulaRegex = /\$([^$]+?)\$/g
        const matches = []
        let match
        
        formulaRegex.lastIndex = 0
        
        // 收集所有公式
        while ((match = formulaRegex.exec(text)) !== null) {
          matches.push({
            fullMatch: match[0],
            formula: match[1],
            index: match.index
          })
        }
        
        console.log(`📊 找到 ${matches.length} 个公式`, matches.map(m => ({
          formula: m.formula,
          index: m.index
        })))
        
        if (matches.length === 0) {
          console.log('ℹ️ 没有找到公式，显示原文')
          // 没有公式，直接显示原文（处理 <br> 标签）
          const tempDiv = document.createElement('div')
          tempDiv.innerHTML = text
          formulaEl.innerHTML = ''
          while (tempDiv.firstChild) {
            formulaEl.appendChild(tempDiv.firstChild)
          }
          return
        }
        
        // 清空容器
        formulaEl.innerHTML = ''
        console.log('🧹 已清空容器')
        
        // 分段渲染：文本 + 公式 + 文本 + 公式...
        let lastIndex = 0
        matches.forEach((m, idx) => {
          console.log(`🔢 处理第 ${idx + 1} 个公式:`, m.formula)
          
          // 添加公式前的文本（处理 <br> 标签）
          if (m.index > lastIndex) {
            const textBefore = text.substring(lastIndex, m.index)
            if (textBefore) {
              console.log(`📝 添加公式前文本:`, textBefore.substring(0, 50))
              // 处理 <br> 标签：先创建临时容器解析 HTML
              const tempDiv = document.createElement('div')
              tempDiv.innerHTML = textBefore
              // 将解析后的节点添加到公式容器
              while (tempDiv.firstChild) {
                formulaEl.appendChild(tempDiv.firstChild)
              }
            }
          }
          
          // 渲染公式
          try {
            console.log(`🎨 开始渲染公式: "${m.formula}"`)
            const formulaSpan = document.createElement('span')
            formulaSpan.className = 'katex-formula'
            
            console.log('🔧 调用 katex.render', {
              formula: m.formula,
              element: formulaSpan,
              katexAvailable: typeof window.katex !== 'undefined',
              renderAvailable: typeof window.katex?.render !== 'undefined'
            })
            
            window.katex.render(m.formula, formulaSpan, {
              throwOnError: false,
              displayMode: false
            })
            
            console.log('✅ 公式渲染成功', {
              spanHTML: formulaSpan.innerHTML.substring(0, 100),
              hasKatex: formulaSpan.querySelector('.katex') !== null
            })
            
            formulaEl.appendChild(formulaSpan)
          } catch (error) {
            console.error('❌ 公式渲染失败:', error, {
              formula: m.formula,
              errorMessage: error.message,
              errorStack: error.stack
            })
            // 渲染失败，显示原始公式文本
            const errorText = document.createTextNode(m.fullMatch)
            formulaEl.appendChild(errorText)
          }
          
          lastIndex = m.index + m.fullMatch.length
        })
        
        // 添加最后一个公式后的文本（处理 <br> 标签）
        if (lastIndex < text.length) {
          const textAfter = text.substring(lastIndex)
          if (textAfter) {
            console.log(`📝 添加公式后文本:`, textAfter.substring(0, 50))
            const tempDiv = document.createElement('div')
            tempDiv.innerHTML = textAfter
            while (tempDiv.firstChild) {
              formulaEl.appendChild(tempDiv.firstChild)
            }
          }
        }
        
        console.log('✅ renderSingleFormula 完成', {
          finalHTML: formulaEl.innerHTML.substring(0, 200),
          hasKatexElements: formulaEl.querySelectorAll('.katex').length
        })
        
      } catch (error) {
        console.error('❌ renderSingleFormula 出错:', error)
        // 出错时显示原始文本
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = text
        formulaEl.innerHTML = ''
        while (tempDiv.firstChild) {
          formulaEl.appendChild(tempDiv.firstChild)
        }
      }
    }

    // 渲染所有展开分类的数学公式
    const renderMathFormulas = async () => {
      for (let i = 0; i < categories.value.length; i++) {
        const category = categories.value[i]
        if (category.expanded) {
          await renderCategoryFormulas(category)
        }
      }
    }

    const isLoading = ref(true)
    const statusMsg = ref('正在初始化 Python 环境...')
    let pyodide = null

    // 初始化 Pyodide（在组件挂载时）
    const initPyodide = async () => {
      // 先等待 KaTeX 加载，然后渲染数学公式（只渲染已展开的分类）
      await nextTick() // 确保 DOM 已挂载
      await renderMathFormulas()
      await nextTick() // 确保渲染后的 DOM 已更新

      try {
        // 检查是否已经加载了 Pyodide
        if (window.loadPyodide) {
          statusMsg.value = '正在加载 Python 引擎 (约5MB)...'
          pyodide = await window.loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.23.4/full/'
          })
          await pyodide.loadPackage('numpy')
          isLoading.value = false
          statusMsg.value = 'Python 引擎就绪 (Numpy 已加载)'
        } else {
          // 如果没有加载 Pyodide，动态加载脚本
          statusMsg.value = '正在加载 Pyodide 脚本...'
          await loadPyodideScript()
          statusMsg.value = '正在加载 Python 引擎 (约5MB)...'
          pyodide = await window.loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.23.4/full/'
          })
          await pyodide.loadPackage('numpy')
          isLoading.value = false
          statusMsg.value = 'Python 引擎就绪 (Numpy 已加载)'
        }
      } catch (error) {
        console.error('Pyodide 初始化失败:', error)
        statusMsg.value = '初始化失败: ' + (error.message || String(error))
        isLoading.value = false
      }
    }

    // 添加学科
    const addCategory = async () => {
      const categoryName = newCategoryName.value.trim()
      if (!categoryName) {
        alert('请输入学科名称')
        return
      }

      // 检查学科是否已存在
      if (categories.value.some(cat => cat.name === categoryName)) {
        alert('该学科已存在')
        return
      }

      try {
        // 创建新学科
        const newCategory = {
          name: categoryName,
          data: ref([]),
          expanded: true,
          id: null
        }

        // 添加到本地
        categories.value.push(newCategory)

        // 保存到云端
        if (dataStore.isOnline && dataStore.currentLanguage === 'math') {
          const conceptDoc = {
            categoryName: categoryName,
            items: []
          }
          const newDoc = await dataStore.addMathConcept(conceptDoc)
          newCategory.id = newDoc.id
        }

        cancelAddCategory()
        alert('学科添加成功！')
      } catch (error) {
        console.error('添加学科失败:', error)
        alert('添加学科失败：' + error.message)
      }
    }

    // 取消添加学科
    const cancelAddCategory = () => {
      showAddCategoryDialog.value = false
      newCategoryName.value = ''
    }

    // 确认删除学科
    const confirmDeleteCategory = (categoryName) => {
      if (!confirm(`确定要删除学科「${categoryName}」吗？\n\n删除后该学科下的所有概念将无法恢复！`)) {
        return
      }

      deleteCategory(categoryName)
    }

    // 删除学科
    const deleteCategory = async (categoryName) => {
      try {
        const category = categories.value.find(cat => cat.name === categoryName)
        if (!category) {
          alert('找不到该学科')
          return
        }

        // 从本地删除
        const index = categories.value.findIndex(cat => cat.name === categoryName)
        if (index !== -1) {
          categories.value.splice(index, 1)
        }

        // 从云端删除
        if (category.id && dataStore.isOnline && dataStore.currentLanguage === 'math') {
          await dataStore.deleteMathConcept(category.id)
        }

        alert('学科删除成功！')
      } catch (error) {
        console.error('删除学科失败:', error)
        alert('删除学科失败：' + error.message)
      }
    }

    // 显示添加概念对话框
    const showAddItemDialogFunc = (categoryName) => {
      currentCategoryName.value = categoryName
      newItem.value = {
        concept: '',
        simpleExplain: '',
        professionalExplain: '',
        example1d: '',
        scenario1d: '',
        code1d: '',
        example2d: '',
        scenario2d: '',
        code2d: '',
        output1d: '',
        hasError1d: false,
        output2d: '',
        hasError2d: false,
        renderedFormula: ''
      }
      showAddItemDialog.value = true
    }

    // 确认添加概念
    const confirmAddItem = async () => {
      if (!canAddItem.value) {
        alert('请至少填写概念名称和人话解释')
        return
      }

      try {
        const category = categories.value.find(cat => cat.name === currentCategoryName.value)
        if (!category) {
          alert('找不到该学科')
          return
        }

        // 添加到本地
        category.data.value.push({ ...newItem.value })

        // 保存到云端
        await saveCategory(currentCategoryName.value)

        cancelAddItem()
        alert('概念添加成功！')
        
        // 等待 DOM 更新后渲染公式
        await nextTick()
        await renderCategoryFormulas(category)
      } catch (error) {
        console.error('添加概念失败:', error)
        alert('添加概念失败：' + error.message)
      }
    }

    // 取消添加概念
    const cancelAddItem = () => {
      showAddItemDialog.value = false
      currentCategoryName.value = ''
      newItem.value = {
        concept: '',
        simpleExplain: '',
        professionalExplain: '',
        example1d: '',
        scenario1d: '',
        code1d: '',
        example2d: '',
        scenario2d: '',
        code2d: '',
        output1d: '',
        hasError1d: false,
        output2d: '',
        hasError2d: false,
        renderedFormula: ''
      }
    }

    // 删除概念
    const deleteItem = async (categoryName, itemIndex) => {
      if (!confirm('确定要删除这个概念吗？')) {
        return
      }

      try {
        const category = categories.value.find(cat => cat.name === categoryName)
        if (!category) {
          alert('找不到该学科')
          return
        }

        // 从本地删除
        category.data.value.splice(itemIndex, 1)

        // 保存到云端
        await saveCategory(categoryName)

        alert('概念删除成功！')
      } catch (error) {
        console.error('删除概念失败:', error)
        alert('删除概念失败：' + error.message)
      }
    }

    // 在组件挂载时初始化
    onMounted(async () => {
      // 如果当前语言是 math，确保数据已同步
      if (dataStore.currentLanguage === 'math' && dataStore.isOnline) {
        try {
          await dataStore.syncFromCloud()
        } catch (error) {
          console.error('同步数学数据失败:', error)
        }
      }
      
      // 初始化 Pyodide
      await initPyodide()
    })

    // 动态加载 Pyodide 脚本
    const loadPyodideScript = () => {
      return new Promise((resolve, reject) => {
        if (window.loadPyodide) {
          resolve()
          return
        }
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js'
        script.onload = resolve
        script.onerror = reject
        document.head.appendChild(script)
      })
    }

    // 运行所有测试
    const runAllTests = async () => {
      if (!pyodide) {
        statusMsg.value = 'Python 引擎未就绪，请稍候...'
        return
      }

      statusMsg.value = '正在计算...'
      
      // 遍历所有展开的分类
      for (let category of categories.value) {
        if (!category.expanded) continue
        
        // 获取实际的数据数组（可能是 ref 或普通数组）
        const dataArray = Array.isArray(category.data) ? category.data : category.data?.value
        for (let item of dataArray) {
          // 运行 1D 代码
          if (item.code1d && item.code1d.trim()) {
            try {
              pyodide.runPython(`
                import sys
                import io
                sys.stdout = io.StringIO()
              `)
              await pyodide.runPythonAsync(item.code1d)
              const output = pyodide.runPython('sys.stdout.getvalue()')
              item.output1d = output.trim() || '运行成功 (无输出)'
              item.hasError1d = false
            } catch (err) {
              item.output1d = '错误: ' + err.message
              item.hasError1d = true
            }
          }

          // 运行 2D 代码
          if (item.code2d && item.code2d.trim()) {
            try {
              pyodide.runPython(`
                import sys
                import io
                sys.stdout = io.StringIO()
              `)
              await pyodide.runPythonAsync(item.code2d)
              const output = pyodide.runPython('sys.stdout.getvalue()')
              item.output2d = output.trim() || '运行成功 (无输出)'
              item.hasError2d = false
            } catch (err) {
              item.output2d = '错误: ' + err.message
              item.hasError2d = true
            }
          }
        }
      }
      
      statusMsg.value = '所有计算已完成'
    }


    return {
      categories,
      isLoading,
      statusMsg,
      runAllTests,
      toggleCategory,
      setFormulaRef,
      debouncedSave,
      dataStore,
      // 添加/删除学科
      showAddCategoryDialog,
      newCategoryName,
      addCategory,
      cancelAddCategory,
      confirmDeleteCategory,
      // 添加/删除概念
      showAddItemDialog,
      currentCategoryName,
      newItem,
      canAddItem,
      showAddItemDialogFunc,
      confirmAddItem,
      cancelAddItem,
      deleteItem
    }
  }
}
</script>

<style scoped>
.math-table-container {
  max-width: 1800px;
  margin: 0 auto;
  padding: 1rem;
  padding-bottom: 100px;
}

.header {
  margin-bottom: 1.5rem;
}

.header h2 {
  color: #333;
  margin-bottom: 1rem;
  font-size: 1.8rem;
}

.controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.run-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;
}

.run-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.run-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

.status {
  color: #666;
  font-size: 0.9rem;
}

.categories-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.category-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  overflow: hidden;
}

.category-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  user-select: none;
  transition: all 0.3s ease;
}

.category-header-left {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  flex: 1;
  cursor: pointer;
}

.category-header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.category-header-left:hover {
  opacity: 0.9;
}

.add-category-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.add-category-btn:hover {
  background: #218838;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
}

.add-item-btn,
.delete-category-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 0.4rem 0.6rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
  min-width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-item-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.delete-category-btn:hover {
  background: rgba(220, 53, 69, 0.8);
  transform: scale(1.1);
}

.concept-cell-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.delete-item-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.3rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.3s ease;
  opacity: 0.7;
  flex-shrink: 0;
}

.delete-item-btn:hover {
  opacity: 1;
  transform: scale(1.1);
  background: #c82333;
}

.category-icon {
  font-size: 0.9rem;
  transition: transform 0.3s ease;
  min-width: 20px;
}

.category-title {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 600;
  flex: 1;
}

.category-count {
  font-size: 0.9rem;
  opacity: 0.9;
}

.table-wrapper {
  overflow-x: auto;
  padding: 1rem;
}

/* 使用提供的 .tg 样式 */
.tg {
  border-collapse: collapse;
  border-spacing: 0;
  width: 100%;
  table-layout: auto;
}

.tg td {
  border-color: black;
  border-style: solid;
  border-width: 1px;
  font-family: Arial, sans-serif;
  font-size: 14px;
  overflow: hidden;
  padding: 10px 5px;
  word-break: normal;
  vertical-align: top;
}

/* 公式列特殊处理 - 允许 overflow visible */
.tg td.math-formula {
  overflow: visible !important;
  vertical-align: middle !important;
}

.tg th {
  border-color: black;
  border-style: solid;
  border-width: 1px;
  font-family: Arial, sans-serif;
  font-size: 14px;
  font-weight: normal;
  overflow: hidden;
  padding: 10px 5px;
  word-break: normal;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
}

.tg .tg-0pky {
  border-color: inherit;
  text-align: left;
  vertical-align: top;
}

.tg .tg-g6kh {
  border-color: inherit;
  color: #1F1F1F;
  text-align: left;
  vertical-align: top;
}

.concept-cell {
  font-weight: 600;
  color: #333;
  white-space: normal;
}

.simple-explain {
  color: #666;
  word-wrap: break-word;
  max-width: 200px;
}

.math-formula {
  width: auto;
  text-align: left;
  max-width: 400px;
  /* 确保表格单元格能正确显示 KaTeX */
  vertical-align: middle;
  padding: 10px 5px !important;
}

/* 公式容器样式 - 关键修复 */
.formula-container {
  white-space: normal;
  line-height: 1.6;
  display: block;
  /* 确保 KaTeX 在表格中正确显示 */
  min-height: 1em;
}

/* KaTeX 在表格中的样式修复 */
.math-formula :deep(.katex) {
  font-size: 1.4rem !important;
  color: #667eea;
  display: inline-block;
  vertical-align: middle;
  /* 确保在表格中正确对齐 */
  line-height: 1.2;
}

.math-formula :deep(.katex-display) {
  font-size: 1.6rem !important;
  margin: 0.5em 0;
  display: block;
}

/* 确保 KaTeX 渲染的元素可见 */
.math-formula :deep(.katex .base) {
  display: inline-block;
  vertical-align: middle;
}

.math-formula :deep(.katex .strut) {
  display: inline-block;
}

/* 公式 span 样式 */
.katex-formula {
  display: inline-block;
  margin: 0 0.1em;
  vertical-align: middle;
}

/* 公式容器样式 */
.formula-container {
  white-space: normal;
  line-height: 1.6;
}

.katex-formula {
  display: inline-block;
  margin: 0 0.1em;
}

.example-scenario-1d,
.example-scenario-2d {
  max-width: 300px;
  min-width: 200px;
}

.example-scenario-content {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.example-part {
  color: #666;
  font-style: italic;
  font-weight: 600;
  padding: 0.5rem;
  background: #f0f9ff;
  border-left: 3px solid #667eea;
  border-radius: 4px;
}

.example-part strong {
  color: #667eea;
  margin-right: 0.5rem;
}

.scenario-part {
  color: #555;
  font-size: 0.85rem;
  line-height: 1.5;
  word-wrap: break-word;
  background: #f8f9fa;
  padding: 0.8rem !important;
  border-radius: 4px;
}

.scenario-part strong {
  color: #333;
  margin-right: 0.5rem;
}

.code-cell {
  width: auto;
  min-width: 300px;
  max-width: 500px;
  padding: 0.5rem !important;
}

.code-editor {
  width: 100%;
  min-height: 150px;
  max-width: 250%;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  background: #2d2d2d;
  color: #ccc;
  border: none;
  border-radius: 6px;
  padding: 0.8rem;
  resize: both;
  line-height: 1.5;
  box-sizing: border-box;
}

.code-editor:focus {
  outline: 2px solid #667eea;
  outline-offset: 2px;
}

.output-cell {
  font-family: 'Courier New', monospace;
  color: #999;
  background: #fefefe;
  width: auto;
  min-width: 150px;
  max-width: 300px;
  white-space: pre-wrap;
  word-break: break-word;
}

.output-cell.has-val {
  color: #28a745;
  font-weight: 600;
  background: #f0f9f4;
}

.output-cell.has-error {
  color: #dc3545;
  font-weight: 600;
  background: #fff5f5;
}

.tg tbody tr:nth-child(even) {
  background: #f8f9fa;
}

.tg tbody tr:hover {
  background: #f0f0f0;
}

/* 移动端优化 */
@media (max-width: 768px) {
  .math-table-container {
    padding: 0.5rem;
  }

  .header h2 {
    font-size: 1.4rem;
  }

  .controls {
    flex-direction: column;
    align-items: stretch;
  }

  .run-btn {
    width: 100%;
  }

  .tg {
    font-size: 0.75rem;
  }

  .tg th,
  .tg td {
    padding: 6px 4px;
    font-size: 0.75rem;
  }

  .code-editor {
    min-height: 60px;
    font-size: 0.7rem;
  }

  .code-cell {
    min-width: 120px;
    max-width: 180px;
  }

  .output-cell {
    min-width: 100px;
    max-width: 150px;
  }
}

@media (max-width: 480px) {
  .tg {
    font-size: 0.7rem;
  }

  .tg th,
  .tg td {
    padding: 4px 3px;
    font-size: 0.7rem;
  }

  .concept-cell,
  .simple-explain {
    max-width: 100px;
  }

  .math-formula {
    max-width: 120px;
  }

  .example-scenario-1d,
  .example-scenario-2d {
    max-width: 150px;
    min-width: 120px;
  }

  .example-scenario-content {
    gap: 0.5rem;
  }

  .example-part,
  .scenario-part {
    font-size: 0.7rem;
    padding: 0.4rem !important;
  }

  .code-cell {
    min-width: 100px;
    max-width: 150px;
  }

  .output-cell {
    min-width: 80px;
    max-width: 120px;
  }
}

/* 对话框样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.dialog-content {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.dialog-content.large-dialog {
  max-width: 800px;
}

.dialog-content h3 {
  margin-bottom: 1.5rem;
  color: #333;
  font-size: 1.3rem;
}

.form-group {
  margin-bottom: 1.2rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #666;
  font-weight: 500;
  font-size: 0.9rem;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.8rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
  box-sizing: border-box;
  font-family: inherit;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-textarea.code-textarea {
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  background: #f8f9fa;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #667eea;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.example-scenario-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.form-subgroup {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.sub-label {
  font-size: 0.85rem;
  color: #666;
  font-weight: 500;
}

.dialog-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.confirm-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
}

.confirm-btn:hover:not(:disabled) {
  background: #218838;
}

.confirm-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.cancel-btn {
  background: #6c757d;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
}

.cancel-btn:hover {
  background: #5a6268;
}

/* 移动端优化 */
@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .dialog-content {
    padding: 1.5rem;
    max-width: 95%;
  }
  
  .dialog-content.large-dialog {
    max-width: 95%;
  }
  
  .category-header {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
  
  .category-header-left {
    width: 100%;
  }
  
  .category-header-right {
    justify-content: flex-end;
  }
}
</style>
