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
            <span class="category-count">({{ (Array.isArray(category.data) ? category.data : category.data?.value || []).length }} 个概念)</span>
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
                    <div class="item-actions">
                      <button @click="showEditItemDialogFunc(category.name, index)" class="edit-item-btn" title="编辑概念">
                        ✏️
                      </button>
                      <button @click="deleteItem(category.name, index)" class="delete-item-btn" title="删除概念">
                        🗑️
                      </button>
                    </div>
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

    <!-- 编辑概念对话框 -->
    <div v-if="showEditItemDialog && editingItem.itemData" class="dialog-overlay" @click="cancelEditItem">
      <div class="dialog-content large-dialog" @click.stop>
        <h3>编辑概念「{{ editingItem.itemData.concept || '' }}」</h3>
        <div class="form-group">
          <label>概念名称：</label>
          <textarea 
            v-model="editingItem.itemData.concept" 
            class="form-textarea"
            rows="2"
            placeholder="例如：随机变量<br>確率変数<br>(かくりつへんすう)<br>Random Var"
          ></textarea>
        </div>
        <div class="form-group">
          <label>人话解释：</label>
          <textarea 
            v-model="editingItem.itemData.simpleExplain" 
            class="form-textarea"
            rows="2"
            placeholder='例如：不是确定的值，而是用数字记录"不确定事件"的规则。'
          ></textarea>
        </div>
        <div class="form-group">
          <label>专业解释（公式、符号及其特性）：</label>
          <textarea 
            v-model="editingItem.itemData.professionalExplain" 
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
              <input v-model="editingItem.itemData.example1d" type="text" class="form-input" placeholder="例如：室温" />
            </div>
            <div class="form-subgroup">
              <label class="sub-label">使用场景：</label>
              <textarea 
                v-model="editingItem.itemData.scenario1d" 
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
              <input v-model="editingItem.itemData.example2d" type="text" class="form-input" placeholder="例如：像素亮度" />
            </div>
            <div class="form-subgroup">
              <label class="sub-label">使用场景：</label>
              <textarea 
                v-model="editingItem.itemData.scenario2d" 
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
            v-model="editingItem.itemData.code1d" 
            class="form-textarea code-textarea"
            rows="3"
            placeholder="例如：import numpy as np&#10;temp_1d = np.random.normal(25, 2, 3)&#10;print(f&quot;1D室温: {temp_1d.round(2)}&quot;)"
          ></textarea>
        </div>
        <div class="form-group">
          <label>2D Python 代码：</label>
          <textarea 
            v-model="editingItem.itemData.code2d" 
            class="form-textarea code-textarea"
            rows="3"
            placeholder="例如：import numpy as np&#10;pixel_2d = np.random.normal(128, 20, (3, 3))&#10;print(f&quot;2D像素亮度:\\n{pixel_2d.round(0)}&quot;)"
          ></textarea>
        </div>
        <div class="dialog-actions">
          <button @click="confirmEditItem" class="confirm-btn" :disabled="!canEditItem">
            确认修改
          </button>
          <button @click="cancelEditItem" class="cancel-btn">
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

    // Richardson-Lucy 反卷积算法数据
    const defaultRLData = [
      {
        concept: '泊松分布<br>Poisson Distribution',
        simpleExplain: '单位时间/单位区域内，某种稀有事件出现的次数，服从泊松分布。在图像处理中，光子计数、像素亮度都遵循泊松分布。',
        professionalExplain: '公式： $P(Y=k) = \\frac{\\lambda^k e^{-\\lambda}}{k!}$ <br>其中 $Y \\sim \\mathrm{Poisson}(\\lambda)$ <br>符号特性： <br>1. $\\lambda$ 既是期望也是方差： $E[Y] = \\mathrm{Var}(Y) = \\lambda$ <br>2. 独立像素： $Y_i \\sim \\mathrm{Poisson}((Hx)_i)$，其中 $(Hx)_i$ 是第 $i$ 个像素的期望光子数。',
        example1d: '路口车流量',
        scenario1d: '使用场景：在一分钟内，路口通过的车辆数量。如果平均每分钟通过 5 辆车，那么实际通过 0, 1, 2, ... 辆车的概率遵循泊松分布。',
        code1d: 'import numpy as np\n# 泊松分布示例：平均每分钟5辆车\nlambda_val = 5\nsamples = np.random.poisson(lambda_val, 100)\nprint(f"平均: {np.mean(samples):.2f}, 方差: {np.var(samples):.2f}")\nprint(f"理论值: λ={lambda_val}")',
        output1d: '',
        hasError1d: false,
        example2d: '像素光子计数',
        scenario2d: '使用场景：在低光成像中，每个像素接收到的光子数遵循泊松分布。曝光时间固定时，每帧每个像素接收到的光子数 ≈ Poisson(λ)，其中 λ 是期望光子数。强信号处噪声大，弱信号处噪声小，这是泊松噪声的典型特征。',
        code2d: 'import numpy as np\n# 2D 泊松噪声图像\nimage_true = np.array([[10, 50, 100], [30, 80, 120], [20, 60, 90]])\nimage_noisy = np.random.poisson(image_true)\nprint(f"真实图像:\\n{image_true}")\nprint(f"\\n泊松噪声图像:\\n{image_noisy}")',
        output2d: '',
        hasError2d: false,
        renderedFormula: ''
      },
      {
        concept: '似然<br>Likelihood',
        simpleExplain: '把观测数据当固定，把参数当变量，看在这个参数下，"出现现在这组数据"有多可能。似然函数衡量不同参数值产生当前观测数据的"可能性"。',
        professionalExplain: '给定观测 $y$，参数 $x$ 的似然： $L(x \\mid y) = P(y \\mid x)$ <br>在 RL 算法中： $L(x \\mid y) = \\prod_i \\mathrm{Poisson}(y_i \\mid (Hx)_i) = \\prod_i \\frac{((Hx)_i)^{y_i} e^{-(Hx)_i}}{y_i!}$ <br>符号特性： <br>1. 似然是参数的函数，不是概率分布（不归一化）<br>2. 似然值越大，说明该参数值越"可能"产生当前观测。',
        example1d: '掷硬币实验',
        scenario1d: '使用场景：掷硬币 10 次，出现 7 次正面。假设正面概率是 $p$，那么这组结果的似然是 $L(p) = p^7(1-p)^3$。不同的 $p$ 值会产生不同的似然值，$p=0.7$ 时似然最大。',
        code1d: 'import numpy as np\n# 似然函数示例：掷硬币\np_values = np.linspace(0, 1, 100)\nlikelihood = p_values**7 * (1 - p_values)**3\nmax_idx = np.argmax(likelihood)\nprint(f"最大似然对应的 p: {p_values[max_idx]:.3f}")',
        output1d: '',
        hasError1d: false,
        example2d: '图像去模糊',
        scenario2d: '使用场景：已知模糊图像 $y$，不同清晰图像 $x$ 经过模糊核 $H$ 产生的 $Hx$ 与 $y$ 的"匹配程度"（泊松概率）。似然函数 $L(x \\mid y)$ 衡量在泊松噪声模型下，清晰图像 $x$ 产生观测 $y$ 的可能性。',
        code2d: 'import numpy as np\nfrom scipy.signal import convolve2d\n# 简单似然计算示例\nx = np.array([[1, 2], [3, 4]])\nh = np.array([[0.25, 0.25], [0.25, 0.25]])\nHx = convolve2d(x, h, mode="same")\ny = np.array([[2, 3], [4, 5]])\n# 泊松似然（简化）\nlikelihood = np.prod((Hx**y) * np.exp(-Hx) / np.array([np.math.factorial(int(yi)) for yi in y.flatten()]).reshape(y.shape))\nprint(f"似然值: {likelihood:.6f}")',
        output2d: '',
        hasError2d: false,
        renderedFormula: ''
      },
      {
        concept: '极大似然估计<br>Maximum Likelihood Estimation (MLE)',
        simpleExplain: '在所有可能的参数 $x$ 里，挑一个能"最容易"产生当前观测数据的。MLE 就是找使似然函数最大的参数值。',
        professionalExplain: '极大似然估计： $\\hat{x}_{ML} = \\arg\\max_x L(x \\mid y) = \\arg\\max_x \\log L(x \\mid y)$ <br>泊松情形下的对数似然： $\\log L(x) = \\sum_i \\big(y_i \\log(Hx)_i - (Hx)_i - \\log(y_i!)\\big)$ <br>符号特性： <br>1. 取对数后，乘法变加法，方便求导<br>2. 常数项 $\\log(y_i!)$ 在优化时可忽略<br>3. MLE 在泊松噪声下等价于最小化 KL 散度。',
        example1d: '硬币概率估计',
        scenario1d: '使用场景：用扔硬币的结果反推硬币真实的正面概率。如果 10 次中 7 次正面，MLE 估计 $\\hat{p} = 7/10 = 0.7$，这就是使似然函数最大的 $p$ 值。',
        code1d: 'import numpy as np\n# MLE 示例：估计硬币概率\nobservations = [1, 1, 0, 1, 1, 0, 1, 1, 1, 0]  # 1=正面, 0=反面\np_mle = np.mean(observations)\nprint(f"MLE 估计的正面概率: {p_mle:.2f}")',
        output1d: '',
        hasError1d: false,
        example2d: '图像反卷积',
        scenario2d: '使用场景：用模糊图像 $y$ 反推清晰图像 $x$，使得在泊松噪声下，观察到 $y$ 的概率最大。MLE 目标就是找使 $\\log L(x \\mid y)$ 最大的 $x$，这就是 RL 算法要解决的问题。',
        code2d: 'import numpy as np\n# MLE 目标函数示例（对数似然）\ndef log_likelihood(x, y, Hx):\n    # 避免 log(0)\n    Hx_safe = np.maximum(Hx, 1e-10)\n    return np.sum(y * np.log(Hx_safe) - Hx_safe)\n\nx = np.array([[1, 2], [3, 4]])\ny = np.array([[2, 3], [4, 5]])\nHx = np.array([[1.5, 2.5], [3.5, 4.5]])\nll = log_likelihood(x, y, Hx)\nprint(f"对数似然值: {ll:.2f}")',
        output2d: '',
        hasError2d: false,
        renderedFormula: ''
      },
      {
        concept: '卷积成像模型<br>Convolution Imaging Model',
        simpleExplain: '真实物体 $x$ 被模糊核 $h$ "抹开"得到 $Hx$，再加上泊松噪声，变成我们看到的 $y$。这是图像退化的数学模型。',
        professionalExplain: '离散卷积形式： $(Hx)_i = \\sum_j h_{ij} x_j$ <br>观测模型： $y_i \\sim \\mathrm{Poisson}((Hx)_i)$ <br>其中： <br>1. $x$ 是真实清晰图像（向量或矩阵）<br>2. $H$ 是卷积算子（矩阵形式），$h$ 是点扩散函数 PSF<br>3. $y$ 是观测到的模糊+噪声图像<br>符号特性： $H$ 通常是 Toeplitz 或循环矩阵，可以用 FFT 加速计算。',
        example1d: '传感器响应',
        scenario1d: '使用场景：真实温度曲线 $x$ 被一个"传感器响应函数" $h$ 卷积，模拟传感器的空间分辨率限制，然后再测量得到带噪声的观测 $y$。',
        code1d: 'import numpy as np\n# 1D 卷积成像模型\nx_true = np.array([0, 0, 1, 3, 2, 0, 0])\nh = np.array([0.2, 0.6, 0.2])  # 模糊核\nHx = np.convolve(x_true, h, mode="same")\ny = np.random.poisson(Hx)  # 泊松噪声\nprint(f"真实信号: {x_true}")\nprint(f"模糊后: {Hx.round(2)}")\nprint(f"观测(含噪声): {y}")',
        output1d: '',
        hasError1d: false,
        example2d: '显微镜/望远镜成像',
        scenario2d: '使用场景：显微镜的点扩散函数 PSF 与真实图像卷积，模拟光学系统的模糊效应，再加上泊松光子噪声，得到最终观测图像。这是天文图像、荧光显微镜图像的典型退化模型。',
        code2d: 'import numpy as np\nfrom scipy.signal import convolve2d\n# 2D 卷积成像模型\nx_true = np.array([[0, 0, 0], [0, 5, 0], [0, 0, 0]])\nh = np.array([[0.1, 0.2, 0.1], [0.2, 0.4, 0.2], [0.1, 0.2, 0.1]])  # 2D PSF\nHx = convolve2d(x_true, h, mode="same")\ny = np.random.poisson(Hx)\nprint(f"真实图像:\\n{x_true}")\nprint(f"\\n模糊后:\\n{Hx.round(2)}")\nprint(f"\\n观测(含噪声):\\n{y}")',
        output2d: '',
        hasError2d: false,
        renderedFormula: ''
      },
      {
        concept: 'RL 算法目标<br>RL Algorithm Objective',
        simpleExplain: '给你模糊又有噪声的图 $y$，和已知的模糊核 $h$，想要找回原始清晰图 $x$。RL 算法通过极大似然估计来解决这个反卷积问题。',
        professionalExplain: 'RL 算法要解决的问题： $\\hat{x} = \\arg\\max_{x \\ge 0} P(y \\mid x)$ <br>其中 $P(y \\mid x) = \\prod_i \\mathrm{Poisson}(y_i \\mid (Hx)_i)$ 是泊松似然<br>约束条件： $x \\ge 0$（图像强度必须非负）<br>等价于： $\\hat{x} = \\arg\\max_{x \\ge 0} \\sum_i \\big(y_i \\log(Hx)_i - (Hx)_i\\big)$ <br>符号特性： <br>1. 这是一个约束优化问题<br>2. RL 使用乘性更新保证非负性<br>3. 迭代收敛到 MLE 解。',
        example1d: '温度曲线恢复',
        scenario1d: '使用场景：想根据"模糊的体温曲线"反推真实体温变化。已知传感器的响应函数（模糊核），通过 RL 算法可以从带噪声的观测中恢复原始温度信号。',
        code1d: 'import numpy as np\n# RL 目标：从模糊观测恢复清晰信号\nx_true = np.array([0, 0, 1, 3, 2, 0, 0])\nh = np.array([0.2, 0.6, 0.2])\nHx = np.convolve(x_true, h, mode="same")\ny = np.random.poisson(Hx)\nprint(f"目标：从观测 {y} 恢复真实信号 {x_true}")',
        output1d: '',
        hasError1d: false,
        example2d: '天文/显微图像反卷积',
        scenario2d: '使用场景：天文图像反卷积、荧光显微镜图像去模糊。给定模糊+噪声的观测图像 $y$ 和已知的 PSF $h$，RL 算法通过迭代优化极大似然目标，逐步恢复清晰图像 $x$。这是 RL 算法的经典应用场景。',
        code2d: 'import numpy as np\nfrom scipy.signal import convolve2d\n# RL 目标：从模糊观测恢复清晰图像\nx_true = np.array([[0, 0, 0], [0, 5, 0], [0, 0, 0]])\nh = np.array([[0.1, 0.2, 0.1], [0.2, 0.4, 0.2], [0.1, 0.2, 0.1]])\nHx = convolve2d(x_true, h, mode="same")\ny = np.random.poisson(Hx)\nprint(f"目标：从观测图像恢复真实图像")',
        output2d: '',
        hasError2d: false,
        renderedFormula: ''
      },
      {
        concept: '步骤1：写出对数似然<br>Step 1: Log-Likelihood',
        simpleExplain: '先把所有像素的泊松概率乘起来，再取 log，方便推导。对数似然把乘法变加法，求导更容易。',
        professionalExplain: '对数似然函数： $\\log L(x) = \\sum_i \\big(y_i \\log(Hx)_i - (Hx)_i - \\log(y_i!)\\big)$ <br>简化形式（忽略常数项）： $\\log L(x) = \\sum_i \\big(y_i \\log(Hx)_i - (Hx)_i\\big)$ <br>符号特性： <br>1. $\\log(y_i!)$ 是常数，优化时可忽略<br>2. 对数变换保持单调性，最大化 $\\log L$ 等价于最大化 $L$<br>3. 对数似然便于求导和数值优化。',
        example1d: '对数变换的优势',
        scenario1d: '使用场景：把很多概率的乘法 $P_1 \\times P_2 \\times ...$ 变成加法 $\\log P_1 + \\log P_2 + ...$，这样求导数时，每个项独立求导，计算更简单。',
        code1d: 'import numpy as np\n# 对数似然计算\nx = np.array([1, 2, 3])\ny = np.array([2, 3, 4])\nHx = np.array([1.5, 2.5, 3.5])\n# 避免 log(0)\nHx_safe = np.maximum(Hx, 1e-10)\nlog_likelihood = np.sum(y * np.log(Hx_safe) - Hx_safe)\nprint(f"对数似然: {log_likelihood:.2f}")',
        output1d: '',
        hasError1d: false,
        example2d: '图像对数似然',
        scenario2d: '使用场景：在图像反卷积中，对数似然 $\\sum_i (y_i \\log(Hx)_i - (Hx)_i)$ 衡量当前估计 $x$ 产生观测 $y$ 的"可能性"。RL 算法通过最大化这个函数来恢复清晰图像。',
        code2d: 'import numpy as np\n# 2D 图像对数似然\nx = np.array([[1, 2], [3, 4]])\ny = np.array([[2, 3], [4, 5]])\nHx = np.array([[1.5, 2.5], [3.5, 4.5]])\nHx_safe = np.maximum(Hx, 1e-10)\nlog_likelihood = np.sum(y * np.log(Hx_safe) - Hx_safe)\nprint(f"对数似然: {log_likelihood:.2f}")',
        output2d: '',
        hasError2d: false,
        renderedFormula: ''
      },
      {
        concept: '步骤2：计算梯度<br>Step 2: Compute Gradient',
        simpleExplain: '看 log-likelihood 对 $x_j$ 的变化率。梯度告诉我们：如果稍微增加 $x_j$，对数似然会增加还是减少，增加多少。',
        professionalExplain: '对 $x_j$ 求偏导： $\\frac{\\partial \\log L}{\\partial x_j} = \\sum_i \\Big(\\frac{y_i}{(Hx)_i} - 1\\Big) h_{ij}$ <br>矩阵形式： $\\nabla \\log L = H^T \\Big(\\frac{y}{Hx} - \\mathbf{1}\\Big)$ <br>其中： <br>1. $H^T$ 是 $H$ 的转置（反卷积方向的传播）<br>2. $\\frac{y}{Hx}$ 是逐元素除法（比值）<br>3. $\\mathbf{1}$ 是全 1 向量<br>符号特性： 如果 $y_i > (Hx)_i$（预测太小），梯度为正，敦促 $x$ 增大；反之亦然。',
        example1d: '梯度方向',
        scenario1d: '使用场景：梯度告诉我们优化的方向。如果观测值 $y_i$ 大于预测值 $(Hx)_i$，说明当前估计 $x$ 太小，梯度为正，应该增大 $x$。这是 RL 算法的核心思想。',
        code1d: 'import numpy as np\n# 计算梯度\nx = np.array([1, 2, 3])\ny = np.array([2, 3, 4])\nh = np.array([0.2, 0.6, 0.2])\nHx = np.convolve(x, h, mode="same")\nHx_safe = np.maximum(Hx, 1e-10)\nratio = y / Hx_safe - 1\n# 简化：h 的转置就是翻转\nh_T = h[::-1]\ngradient = np.convolve(ratio, h_T, mode="same")\nprint(f"梯度: {gradient.round(3)}")',
        output1d: '',
        hasError1d: false,
        example2d: '图像梯度计算',
        scenario2d: '使用场景：在图像反卷积中，梯度 $H^T(\\frac{y}{Hx} - \\mathbf{1})$ 从观测空间"反向传播"到图像空间。$H^T$ 是反卷积操作，把残差信息传回，指导图像 $x$ 的更新方向。',
        code2d: 'import numpy as np\nfrom scipy.signal import convolve2d\n# 2D 梯度计算\nx = np.array([[1, 2], [3, 4]])\ny = np.array([[2, 3], [4, 5]])\nh = np.array([[0.1, 0.2, 0.1], [0.2, 0.4, 0.2], [0.1, 0.2, 0.1]])\nHx = convolve2d(x, h, mode="same")\nHx_safe = np.maximum(Hx, 1e-10)\nratio = y / Hx_safe - 1\n# H^T 是翻转的 h\nh_T = h[::-1, ::-1]\ngradient = convolve2d(ratio, h_T, mode="same")\nprint(f"梯度:\\n{gradient.round(3)}")',
        output2d: '',
        hasError2d: false,
        renderedFormula: ''
      },
      {
        concept: '步骤3：乘性更新思想<br>Step 3: Multiplicative Update',
        simpleExplain: '因为 $x$ 代表亮度/强度，必须非负，不想用普通的加减更新，就用"乘法"迭代。每次用当前值乘以一个非负因子，保证结果永远非负。',
        professionalExplain: '设计形如： $x^{(k+1)} = x^{(k)} \\cdot \\text{因子}$ <br>RL 算法选用： $\\text{因子} = H^T\\Big(\\frac{y}{Hx^{(k)}}\\Big)$ <br>更新公式： $x^{(k+1)} = x^{(k)} \\cdot H^T\\Big(\\frac{y}{Hx^{(k)}}\\Big)$ <br>符号特性： <br>1. 乘性更新保证 $x^{(k+1)} \\ge 0$（如果初始 $x^{(0)} \\ge 0$）<br>2. 因子 $H^T(\\frac{y}{Hx})$ 反映"预测误差"<br>3. 如果预测太小（$y > Hx$），因子 $> 1$，$x$ 增大；反之减小。',
        example1d: '温度信号恢复',
        scenario1d: '使用场景：不直接"加减温度"，而是"按比例放大或缩小"，保证不出现负值。如果观测值大于预测值，就按比例增大估计值；反之按比例减小。',
        code1d: 'import numpy as np\n# 乘性更新示例\nx = np.array([1.0, 2.0, 3.0])\ny = np.array([2, 3, 4])\nh = np.array([0.2, 0.6, 0.2])\nHx = np.convolve(x, h, mode="same")\nHx_safe = np.maximum(Hx, 1e-10)\nratio = y / Hx_safe\nh_T = h[::-1]\nfactor = np.convolve(ratio, h_T, mode="same")\nx_new = x * factor\nprint(f"旧值: {x}")\nprint(f"因子: {factor.round(3)}")\nprint(f"新值: {x_new.round(3)}")',
        output1d: '',
        hasError1d: false,
        example2d: '图像强度更新',
        scenario2d: '使用场景：每次迭代，增强那些"预测太小"的区域（因子 > 1），抑制"预测太大"的区域（因子 < 1）。乘性更新保证像素值永远非负，符合物理意义（光强度不能为负）。',
        code2d: 'import numpy as np\nfrom scipy.signal import convolve2d\n# 2D 乘性更新\nx = np.array([[1.0, 2.0], [3.0, 4.0]])\ny = np.array([[2, 3], [4, 5]])\nh = np.array([[0.1, 0.2, 0.1], [0.2, 0.4, 0.2], [0.1, 0.2, 0.1]])\nHx = convolve2d(x, h, mode="same")\nHx_safe = np.maximum(Hx, 1e-10)\nratio = y / Hx_safe\nh_T = h[::-1, ::-1]\nfactor = convolve2d(ratio, h_T, mode="same")\nx_new = x * factor\nprint(f"更新因子:\\n{factor.round(3)}")\nprint(f"\\n新图像:\\n{x_new.round(2)}")',
        output2d: '',
        hasError2d: false,
        renderedFormula: ''
      },
      {
        concept: '步骤4：RL 迭代公式<br>Step 4: RL Iteration Formula',
        simpleExplain: '当前估计 $x^{(k)}$ 经过卷积预测 $Hx^{(k)}$，与观测 $y$ 做比值，再反卷积回来，作为乘法因子。这就是完整的 RL 迭代公式。',
        professionalExplain: '经典 RL 迭代公式： $x^{(k+1)} = x^{(k)} \\cdot H^T\\Big(\\frac{y}{Hx^{(k)}}\\Big)$ <br>归一化形式（PSF 未归一化时）： $x^{(k+1)} = x^{(k)} \\cdot \\frac{H^T\\big(\\frac{y}{Hx^{(k)}}\\big)}{H^T\\mathbf{1}}$ <br>其中： <br>1. $Hx^{(k)}$ 是当前估计的"预测观测"<br>2. $\\frac{y}{Hx^{(k)}}$ 是"误差比值"<br>3. $H^T(\\cdot)$ 是反卷积操作<br>符号特性： 迭代收敛到 MLE 解，保证非负性和能量守恒（如果 PSF 归一化）。',
        example1d: '1D RL 反卷积',
        scenario1d: '使用场景：用一维卷积和反卷积实现 RL 公式。初始化 $x^{(0)} = \\mathbf{1}$（全 1），迭代更新直到收敛。每次迭代：预测 → 比较 → 反卷积 → 乘性更新。',
        code1d: 'import numpy as np\n# 1D RL 算法完整实现\nx_true = np.array([0, 0, 1, 3, 2, 0, 0], dtype=float)\nh = np.array([0.2, 0.6, 0.2])\nHx = np.convolve(x_true, h, mode="same")\ny = np.random.poisson(Hx)\n\n# RL 初始化\nx = np.ones_like(x_true)\n\n# RL 迭代\nfor k in range(10):\n    Hx_pred = np.convolve(x, h, mode="same")\n    Hx_pred = np.maximum(Hx_pred, 1e-10)\n    ratio = y / Hx_pred\n    h_T = h[::-1]\n    back = np.convolve(ratio, h_T, mode="same")\n    x = x * back\n\nprint(f"观测 y: {y}")\nprint(f"恢复 x: {x.round(3)}")\nprint(f"真实 x: {x_true}")',
        output1d: '',
        hasError1d: false,
        example2d: '2D RL 图像反卷积',
        scenario2d: '使用场景：天文图像、显微镜图像的反卷积。用 `convolve2d` 或 FFT 实现 $(Hx^{(k)})$ 和 $H^T(\\cdot)$，迭代得到逐步变清晰的图像。RL 算法在泊松噪声下表现优异，是图像反卷积的经典方法。',
        code2d: 'import numpy as np\nfrom scipy.signal import convolve2d\n# 2D RL 算法完整实现\nx_true = np.array([[0, 0, 0], [0, 5, 0], [0, 0, 0]], dtype=float)\nh = np.array([[0.1, 0.2, 0.1], [0.2, 0.4, 0.2], [0.1, 0.2, 0.1]])\nHx = convolve2d(x_true, h, mode="same")\ny = np.random.poisson(Hx)\n\n# RL 初始化\nx = np.ones_like(x_true)\n\n# RL 迭代\nfor k in range(10):\n    Hx_pred = convolve2d(x, h, mode="same")\n    Hx_pred = np.maximum(Hx_pred, 1e-10)\n    ratio = y / Hx_pred\n    h_T = h[::-1, ::-1]\n    back = convolve2d(ratio, h_T, mode="same")\n    x = x * back\n\nprint(f"恢复图像:\\n{x.round(2)}")\nprint(f"\\n真实图像:\\n{x_true}")',
        output2d: '',
        hasError2d: false,
        renderedFormula: ''
      }
    ]

    // 逆问题（Inverse Problem）数据
    const defaultInverseProblemData = [
      {
        concept: '逆问题定义<br>Inverse Problem Definition',
        simpleExplain: '正问题是"从原因推结果"，逆问题是"从结果推原因"。在成像中，正问题是"清晰图像经过系统变成观测"，逆问题是"从观测恢复清晰图像"。',
        professionalExplain: '正问题： $y = A(x) + \\epsilon$ <br>逆问题：给定 $y$，求 $x$ <br>其中： <br>1. $x$ 是未知的真实信号/图像<br>2. $A(\\cdot)$ 是前向算子（如卷积、采样、投影等）<br>3. $y$ 是观测数据<br>4. $\\epsilon$ 是噪声<br>符号特性： <br>- 逆问题通常是不适定的（ill-posed）：解不唯一或不稳定<br>- 需要正则化来稳定求解。',
        example1d: '温度测量',
        scenario1d: '使用场景：正问题是"真实温度经过传感器响应得到测量值"，逆问题是"从测量值反推真实温度"。传感器有延迟和噪声，需要逆问题方法恢复真实信号。',
        code1d: 'import numpy as np\n# 逆问题示例：从观测恢复信号\nx_true = np.array([20, 22, 25, 23, 21])\n# 前向算子：简单平滑\nA = np.array([[0.5, 0.5, 0, 0, 0],\n              [0, 0.5, 0.5, 0, 0],\n              [0, 0, 0.5, 0.5, 0],\n              [0, 0, 0, 0.5, 0.5]])\ny = A @ x_true + np.random.normal(0, 0.5, 4)\nprint(f"真实信号: {x_true}")\nprint(f"观测: {y.round(2)}")\nprint(f"逆问题：从 {y.round(2)} 恢复 {x_true}")',
        output1d: '',
        hasError1d: false,
        example2d: 'CT 重建',
        scenario2d: '使用场景：正问题是"物体密度经过 X 射线投影得到投影数据"，逆问题是"从投影数据重建物体密度分布"。这是医学 CT 成像的核心逆问题，需要从有限角度投影恢复 3D 结构。',
        code2d: 'import numpy as np\n# 2D 逆问题：图像重建\nx_true = np.array([[0, 0, 0], [0, 5, 0], [0, 0, 0]])\n# 简化的前向算子（投影）\nA = np.random.rand(4, 9)  # 4个投影，9个像素\ny = A @ x_true.flatten() + np.random.normal(0, 0.1, 4)\nprint(f"逆问题：从 {len(y)} 个投影恢复 {x_true.shape} 图像")',
        output2d: '',
        hasError2d: false,
        renderedFormula: ''
      },
      {
        concept: '不适定性<br>Ill-Posedness',
        simpleExplain: '逆问题通常"不适定"：解可能不唯一（多个解都符合观测），或者解不稳定（观测的小误差导致解的巨大变化）。需要额外约束来稳定求解。',
        professionalExplain: 'Hadamard 适定性条件： <br>1. 解存在（Existence）<br>2. 解唯一（Uniqueness）<br>3. 解连续依赖于数据（Stability）<br>逆问题通常违反条件 2 或 3： <br>- 欠定系统：观测数 < 未知数，解不唯一<br>- 病态系统：条件数大，解不稳定<br>符号特性： <br>- 需要正则化： $\\hat{x} = \\arg\\min_x \\|y - A(x)\\|^2 + \\lambda R(x)$ <br>其中 $R(x)$ 是正则化项，$\\lambda$ 是正则化参数。',
        example1d: '欠定方程组',
        scenario1d: '使用场景：3 个方程求 5 个未知数，解不唯一。需要额外约束（如稀疏性、平滑性）来唯一确定解。这是压缩感知的基础。',
        code1d: 'import numpy as np\n# 不适定问题示例\n# 3个方程，5个未知数（欠定）\nA = np.random.rand(3, 5)\ny = np.array([1, 2, 3])\n# 直接求解会失败（无穷多解）\n# 需要正则化\nprint(f"矩阵形状: {A.shape}, 观测: {y}")\nprint("欠定系统：需要正则化求解")',
        output1d: '',
        hasError1d: false,
        example2d: '图像超分辨率',
        scenario2d: '使用场景：从低分辨率图像恢复高分辨率图像。低分辨率图像像素数 < 高分辨率图像像素数，这是典型的欠定逆问题。需要利用图像的先验知识（如边缘平滑、纹理结构）来稳定求解。',
        code2d: 'import numpy as np\n# 2D 不适定问题：超分辨率\nx_hr = np.random.rand(10, 10)  # 高分辨率\n# 下采样（欠定）\nA = np.zeros((25, 100))  # 25个低分辨率像素，100个高分辨率像素\nfor i in range(25):\n    A[i, i*4:(i+1)*4] = 0.25\ny = A @ x_hr.flatten()\nprint(f"低分辨率: {int(np.sqrt(len(y)))}x{int(np.sqrt(len(y)))}, 高分辨率: {x_hr.shape}")\nprint("欠定系统：需要正则化")',
        output2d: '',
        hasError2d: false,
        renderedFormula: ''
      },
      {
        concept: '正则化<br>Regularization',
        simpleExplain: '在逆问题求解中，加入"惩罚项"来约束解的性质，使不适定问题变成适定问题。常见的正则化包括：平滑性、稀疏性、非负性等。',
        professionalExplain: '正则化目标函数： $\\hat{x} = \\arg\\min_x \\|y - A(x)\\|^2 + \\lambda R(x)$ <br>常见正则化项： <br>1. Tikhonov 正则化： $R(x) = \\|x\\|_2^2$（L2 范数，平滑解）<br>2. L1 正则化： $R(x) = \\|x\\|_1$（L1 范数，稀疏解）<br>3. TV 正则化： $R(x) = \\|\\nabla x\\|_1$（总变分，保持边缘）<br>符号特性： <br>- $\\lambda$ 控制数据拟合与正则化的平衡<br>- $\\lambda \\to 0$：过拟合观测（不稳定）<br>- $\\lambda \\to \\infty$：过度平滑（偏差大）。',
        example1d: '信号去噪',
        scenario1d: '使用场景：从带噪声的观测恢复平滑信号。使用 Tikhonov 正则化 $\\|x\\|_2^2$ 惩罚大的波动，得到平滑解。正则化参数 $\\lambda$ 控制平滑程度。',
        code1d: 'import numpy as np\n# Tikhonov 正则化示例\nx_true = np.array([1, 2, 3, 2, 1])\ny = x_true + np.random.normal(0, 0.5, 5)\n# 正则化求解：min ||y-x||^2 + λ||x||^2\nlambda_reg = 0.1\n# 解析解：x = (I + λI)^(-1) y\nx_reg = y / (1 + lambda_reg)\nprint(f"观测: {y.round(2)}")\nprint(f"正则化恢复: {x_reg.round(2)}")',
        output1d: '',
        hasError1d: false,
        example2d: '图像去模糊',
        scenario2d: '使用场景：从模糊图像恢复清晰图像。使用 TV 正则化 $\\|\\nabla x\\|_1$ 保持边缘锐利，同时抑制噪声。这是图像去模糊的经典方法，在保持细节和抑制伪影之间取得平衡。',
        code2d: 'import numpy as np\n# TV 正则化思想（简化示例）\nx_true = np.array([[1, 1, 0, 0], [1, 1, 0, 0], [0, 0, 1, 1]])\n# TV 正则化惩罚梯度大的区域\n# 实际实现需要计算梯度\nprint(f"TV 正则化：保持边缘，抑制噪声")\nprint(f"图像形状: {x_true.shape}")',
        output2d: '',
        hasError2d: false,
        renderedFormula: ''
      },
      {
        concept: '最小二乘<br>Least Squares',
        simpleExplain: '找使"预测误差平方和"最小的解。如果系统是线性的，有解析解；如果是非线性的，需要迭代优化。',
        professionalExplain: '最小二乘： $\\hat{x} = \\arg\\min_x \\|y - Ax\\|_2^2$ <br>线性系统解析解： $\\hat{x} = (A^T A)^{-1} A^T y$ <br>正则化最小二乘： $\\hat{x} = (A^T A + \\lambda I)^{-1} A^T y$ <br>符号特性： <br>1. 当 $A^T A$ 可逆时，有唯一解<br>2. 当系统欠定时，需要正则化<br>3. 计算复杂度：$O(n^3)$（矩阵求逆）。',
        example1d: '线性拟合',
        scenario1d: '使用场景：用直线 $y = ax + b$ 拟合数据点。最小二乘找使所有点到直线距离平方和最小的 $a, b$。这是最基础的逆问题求解方法。',
        code1d: 'import numpy as np\n# 最小二乘线性拟合\nx_data = np.array([1, 2, 3, 4, 5])\ny_data = np.array([2.1, 3.9, 6.1, 8.0, 9.9])\n# 构建矩阵 A: [x, 1]\nA = np.column_stack([x_data, np.ones(5)])\n# 最小二乘解\ncoeffs = np.linalg.lstsq(A, y_data, rcond=None)[0]\nprint(f"拟合直线: y = {coeffs[0]:.2f}x + {coeffs[1]:.2f}")',
        output1d: '',
        hasError1d: false,
        example2d: '图像重建',
        scenario2d: '使用场景：从投影数据重建图像。最小二乘找使投影误差最小的图像。当投影角度不足时，需要正则化最小二乘来稳定求解。这是 CT 重建的基础方法。',
        code2d: 'import numpy as np\n# 2D 最小二乘重建\nA = np.random.rand(20, 25)  # 20个观测，25个像素\ny = np.random.rand(20)\n# 最小二乘解\nx_ls = np.linalg.lstsq(A, y, rcond=None)[0]\nprint(f"重建图像形状: {x_ls.reshape(5, 5).shape}")',
        output2d: '',
        hasError2d: false,
        renderedFormula: ''
      },
      {
        concept: '迭代重建算法<br>Iterative Reconstruction',
        simpleExplain: '当系统太大或非线性时，无法直接求解析解，就用迭代方法逐步逼近最优解。每次迭代改进当前估计，直到收敛。',
        professionalExplain: '迭代格式： $x^{(k+1)} = x^{(k)} + \\alpha^{(k)} d^{(k)}$ <br>常见算法： <br>1. 梯度下降： $d^{(k)} = -\\nabla f(x^{(k)})$ <br>2. 共轭梯度： $d^{(k)}$ 与之前方向共轭<br>3. 期望最大化（EM）：用于泊松噪声<br>符号特性： <br>- $\\alpha^{(k)}$ 是步长（学习率）<br>- 收敛条件： $\\|x^{(k+1)} - x^{(k)}\\| < \\epsilon$ <br>- 迭代算法适合大规模问题。',
        example1d: '信号恢复',
        scenario1d: '使用场景：从欠采样观测恢复完整信号。用迭代算法逐步改进估计，每次迭代使预测更接近观测。迭代方法可以处理非线性约束（如非负性、稀疏性）。',
        code1d: 'import numpy as np\n# 迭代重建示例\nA = np.random.rand(3, 5)\ny = np.array([1, 2, 3])\nx = np.ones(5)  # 初始估计\nfor k in range(10):\n    residual = y - A @ x\n    grad = -A.T @ residual\n    x = x - 0.1 * grad  # 梯度下降\n    x = np.maximum(x, 0)  # 非负约束\nprint(f"迭代后解: {x.round(3)}")',
        output1d: '',
        hasError1d: false,
        example2d: 'CT 迭代重建',
        scenario2d: '使用场景：从有限角度投影迭代重建图像。每次迭代：预测投影 → 计算误差 → 反向投影更新图像。迭代算法可以处理不完全数据、非线性约束，比解析方法更灵活。',
        code2d: 'import numpy as np\n# 2D 迭代重建\nA = np.random.rand(15, 16)  # 15个投影，16个像素\ny = np.random.rand(15)\nx = np.ones(16)\nfor k in range(20):\n    residual = y - A @ x\n    grad = -A.T @ residual\n    x = x - 0.05 * grad\n    x = np.maximum(x, 0)\nprint(f"迭代重建完成，图像: {x.reshape(4, 4).shape}")',
        output2d: '',
        hasError2d: false,
        renderedFormula: ''
      }
    ]

    // 压缩感知高光谱图像重建数据
    const defaultCompressedSensingData = [
      {
        concept: '压缩感知原理<br>Compressed Sensing (CS)',
        simpleExplain: '如果信号是稀疏的（大部分值为0），可以用远少于信号长度的观测来完美恢复。关键在于信号的稀疏性和观测矩阵的"不相干性"。',
        professionalExplain: '压缩感知： $y = \\Phi x$ <br>其中： <br>1. $x \\in \\mathbb{R}^n$ 是稀疏信号（$\\|x\\|_0 = k \\ll n$）<br>2. $\\Phi \\in \\mathbb{R}^{m \\times n}$ 是观测矩阵（$m < n$，欠采样）<br>3. $y \\in \\mathbb{R}^m$ 是压缩观测<br>恢复条件： <br>- 稀疏性： $\\|x\\|_0 \\le k$<br>- 不相干性： $\\Phi$ 满足 RIP（限制等距性质）<br>恢复方法： $\\hat{x} = \\arg\\min \\|x\\|_1$ s.t. $y = \\Phi x$（L1 最小化）。',
        example1d: '稀疏信号采样',
        scenario1d: '使用场景：信号在某个域（如频域、小波域）是稀疏的，只有少数非零系数。可以用远少于信号长度的随机采样完美恢复。这是压缩感知的核心思想。',
        code1d: 'import numpy as np\n# 压缩感知示例：稀疏信号\nx_sparse = np.zeros(100)\nx_sparse[[10, 30, 70]] = [5, 3, 4]  # 只有3个非零\n# 随机观测矩阵（欠采样）\nPhi = np.random.randn(20, 100)  # 20个观测，100个信号\n# 压缩观测\ny = Phi @ x_sparse\nprint(f"原始信号非零数: {np.count_nonzero(x_sparse)}")\nprint(f"观测数: {len(y)}, 信号长度: {len(x_sparse)}")\nprint("压缩比: 20/100 = 0.2")',
        output1d: '',
        hasError1d: false,
        example2d: '图像压缩采样',
        scenario2d: '使用场景：自然图像在小波域是稀疏的。可以用随机测量矩阵对图像进行欠采样，然后通过 L1 最小化恢复。压缩感知可以实现超 Nyquist 采样率的图像重建。',
        code2d: 'import numpy as np\n# 2D 压缩感知\nx_image = np.random.rand(8, 8)\n# 稀疏化（简化：假设小波域稀疏）\n# 随机观测矩阵\nm, n = 30, 64  # 30个观测，64个像素\nPhi = np.random.randn(m, n)\ny = Phi @ x_image.flatten()\nprint(f"图像: {x_image.shape}, 观测: {len(y)}")\nprint(f"压缩比: {m/n:.2f}")',
        output2d: '',
        hasError2d: false,
        renderedFormula: ''
      },
      {
        concept: '稀疏性<br>Sparsity',
        simpleExplain: '信号在某个表示域（如频域、小波域、梯度域）中，大部分系数为0或接近0，只有少数非零。稀疏性是压缩感知的前提条件。',
        professionalExplain: 'L0 范数（非零元素个数）： $\\|x\\|_0 = \\#\\{i: x_i \\neq 0\\}$ <br>L1 范数（绝对值之和）： $\\|x\\|_1 = \\sum_i |x_i|$ <br>稀疏信号： $\\|x\\|_0 = k \\ll n$ <br>符号特性： <br>1. L0 范数是非凸的，难以优化<br>2. L1 范数是 L0 的凸松弛，在满足 RIP 条件下等价<br>3. 自然信号在变换域（DCT、小波、梯度）通常是稀疏的。',
        example1d: '频域稀疏',
        scenario1d: '使用场景：音频信号在频域通常是稀疏的，只有少数频率分量。语音信号、音乐信号都可以用压缩感知方法，用少量频域采样恢复完整信号。',
        code1d: 'import numpy as np\n# 稀疏性示例\nx_time = np.zeros(100)\nx_time[10:15] = np.sin(np.linspace(0, 2*np.pi, 5))\n# FFT 到频域\nx_freq = np.fft.fft(x_time)\nsparsity = np.count_nonzero(np.abs(x_freq) > 0.1)\nprint(f"时域长度: {len(x_time)}")\nprint(f"频域非零数: {sparsity}")',
        output1d: '',
        hasError1d: false,
        example2d: '图像梯度稀疏',
        scenario2d: '使用场景：自然图像的梯度通常是稀疏的，大部分区域平滑（梯度≈0），只有边缘处梯度大。图像的总变分 $\\|\\nabla x\\|_1$ 通常很小，这是 TV 正则化的基础。',
        code2d: 'import numpy as np\n# 2D 图像梯度稀疏\nimage = np.random.rand(10, 10)\n# 计算梯度\ngrad_x = np.diff(image, axis=1)\ngrad_y = np.diff(image, axis=0)\n# 梯度稀疏性\nsparsity = np.count_nonzero(np.abs(grad_x) < 0.1)\nprint(f"图像大小: {image.shape}")\nprint(f"小梯度像素数: {sparsity}/{grad_x.size}")',
        output2d: '',
        hasError2d: false,
        renderedFormula: ''
      },
      {
        concept: '高光谱图像<br>Hyperspectral Image',
        simpleExplain: '高光谱图像在每个像素位置记录了数百个波长的光谱信息，形成"数据立方体"（空间×空间×光谱）。数据量巨大，但在某些域（如空间域、光谱域）是稀疏的。',
        professionalExplain: '高光谱数据立方体： $\\mathbf{X} \\in \\mathbb{R}^{H \\times W \\times B}$ <br>其中： <br>- $H, W$ 是空间维度<br>- $B$ 是光谱波段数（通常 100-300）<br>- 每个像素是 $B$ 维光谱向量<br>数据特性： <br>1. 数据量大： $H \\times W \\times B$ 个值<br>2. 空间相关性：相邻像素光谱相似<br>3. 光谱相关性：相邻波段相关<br>4. 稀疏性：在某个变换域稀疏。',
        example1d: '光谱曲线',
        scenario1d: '使用场景：一个像素的光谱曲线记录了该位置在不同波长下的反射率。不同材料有不同的"光谱签名"，可以用来识别物质。光谱曲线在频域或某些基下可能是稀疏的。',
        code1d: 'import numpy as np\n# 高光谱像素（光谱向量）\nwavelengths = np.linspace(400, 2500, 200)  # 200个波段\n# 模拟光谱曲线（有特征峰）\nspectrum = np.random.rand(200) + 0.5 * np.exp(-(wavelengths - 800)**2 / 100)\nprint(f"光谱维度: {len(spectrum)}")\nprint(f"波长范围: {wavelengths[0]:.0f}-{wavelengths[-1]:.0f} nm")',
        output1d: '',
        hasError1d: false,
        example2d: '高光谱数据立方体',
        scenario2d: '使用场景：高光谱图像是 3D 数据立方体（行×列×波段）。例如 100×100 像素，200 个波段，总数据量 2,000,000 个值。在压缩感知中，可以对这个数据立方体进行压缩采样和重建。',
        code2d: 'import numpy as np\n# 高光谱数据立方体\nH, W, B = 50, 50, 200  # 50x50像素，200个波段\nhyperspectral_cube = np.random.rand(H, W, B)\nprint(f"数据立方体形状: {hyperspectral_cube.shape}")\nprint(f"总数据量: {H*W*B:,} 个值")\nprint(f"压缩感知：可以用远少于 {H*W*B} 的观测恢复")',
        output2d: '',
        hasError2d: false,
        renderedFormula: ''
      },
      {
        concept: '高光谱压缩感知<br>Hyperspectral CS',
        simpleExplain: '利用高光谱图像在空间和光谱域的稀疏性，用压缩感知方法进行欠采样和重建。可以大幅减少数据采集量，同时保持重建质量。',
        professionalExplain: '高光谱 CS 模型： $\\mathbf{Y} = \\Phi \\mathbf{X}$ <br>其中： <br>- $\\mathbf{X} \\in \\mathbb{R}^{H \\times W \\times B}$ 是高光谱数据立方体<br>- $\\Phi$ 是观测矩阵（可以是空间采样、光谱采样或混合）<br>- $\\mathbf{Y}$ 是压缩观测<br>重建问题： $\\hat{\\mathbf{X}} = \\arg\\min \\|\\mathbf{X}\\|_* + \\lambda \\|\\mathbf{X}\\|_{\\text{TV}}$ <br>s.t. $\\mathbf{Y} = \\Phi \\mathbf{X}$ <br>符号特性： <br>- $\\|\\cdot\\|_*$ 是核范数（低秩约束）<br>- $\\|\\cdot\\|_{\\text{TV}}$ 是总变分（空间平滑）<br>- 联合利用空间和光谱的稀疏性。',
        example1d: '光谱压缩',
        scenario1d: '使用场景：对每个像素的光谱向量进行压缩采样。如果光谱在某个基下稀疏，可以用少量随机测量恢复完整光谱。这可以减少光谱仪的数据采集量。',
        code1d: 'import numpy as np\n# 光谱压缩感知\nspectrum = np.random.rand(200)  # 200个波段\n# 压缩采样（只测50个波段）\nm, n = 50, 200\nPhi = np.random.randn(m, n)\ny = Phi @ spectrum\nprint(f"原始光谱: {len(spectrum)} 波段")\nprint(f"压缩观测: {len(y)} 测量")\nprint(f"压缩比: {m/n:.2f}")',
        output1d: '',
        hasError1d: false,
        example2d: '高光谱图像重建',
        scenario2d: '使用场景：对高光谱数据立方体进行空间或光谱维度的压缩采样，然后用 L1 最小化或低秩+TV 正则化重建。可以用于快照式高光谱成像、编码孔径高光谱相机等应用，大幅减少数据量和采集时间。',
        code2d: 'import numpy as np\n# 高光谱 CS 重建（简化）\nH, W, B = 30, 30, 100\nX = np.random.rand(H, W, B)\n# 压缩采样（空间+光谱）\nm = int(0.3 * H * W * B)  # 30% 采样率\nPhi = np.random.randn(m, H*W*B)\ny = Phi @ X.flatten()\nprint(f"原始数据: {H}x{W}x{B} = {H*W*B:,}")\nprint(f"压缩观测: {m:,}")\nprint(f"压缩比: {m/(H*W*B):.2f}")',
        output2d: '',
        hasError2d: false,
        renderedFormula: ''
      },
      {
        concept: 'L1 最小化重建<br>L1 Minimization',
        simpleExplain: '在压缩感知中，用 L1 范数（绝对值之和）代替 L0 范数（非零个数）来促进稀疏性。L1 最小化是凸优化问题，可以用高效算法求解。',
        professionalExplain: 'L1 最小化： $\\hat{x} = \\arg\\min_x \\|x\\|_1$ s.t. $y = \\Phi x$ <br>或带噪声： $\\hat{x} = \\arg\\min_x \\|x\\|_1 + \\frac{\\lambda}{2}\\|y - \\Phi x\\|_2^2$ <br>求解方法： <br>1. 基追踪（Basis Pursuit）<br>2. 迭代软阈值（IST）<br>3. ADMM（交替方向乘数法）<br>符号特性： <br>- L1 范数促进稀疏性（很多系数被压到0）<br>- 在满足 RIP 条件下，L1 解等价于 L0 解<br>- 计算复杂度：$O(n^3)$（线性规划）或 $O(n^2)$（迭代方法）。',
        example1d: '稀疏信号恢复',
        scenario1d: '使用场景：从压缩观测恢复稀疏信号。L1 最小化找使 L1 范数最小的解，自动促进稀疏性。这是压缩感知的标准重建方法。',
        code1d: 'import numpy as np\nfrom scipy.optimize import minimize\n# L1 最小化（简化示例）\nPhi = np.random.randn(15, 50)\ny = np.random.rand(15)\n# L1 最小化：min ||x||_1 s.t. y = Phi*x\n# 使用线性规划（简化：用 L2 近似）\nx0 = np.zeros(50)\nresult = minimize(lambda x: np.sum(np.abs(x)), x0, \n                constraints={\'type\': \'eq\', \'fun\': lambda x: Phi @ x - y})\nprint(f"L1 最小化恢复，非零数: {np.count_nonzero(np.abs(result.x) > 0.01)}")',
        output1d: '',
        hasError1d: false,
        example2d: '高光谱 L1 重建',
        scenario2d: '使用场景：对高光谱数据立方体进行 L1 最小化重建。可以将数据立方体向量化，然后求解 L1 最小化问题。或者利用数据的低秩结构，使用核范数+TV 正则化。',
        code2d: 'import numpy as np\n# 高光谱 L1 重建思想\nH, W, B = 20, 20, 50\nX = np.random.rand(H, W, B)\n# 向量化\nx = X.flatten()\n# 压缩观测\nm = int(0.2 * len(x))\nPhi = np.random.randn(m, len(x))\ny = Phi @ x\nprint(f"L1 最小化：从 {m:,} 个观测恢复 {len(x):,} 个值")\nprint(f"压缩比: {m/len(x):.2f}")',
        output2d: '',
        hasError2d: false,
        renderedFormula: ''
      },
      {
        concept: '低秩+TV 重建<br>Low-Rank + TV Reconstruction',
        simpleExplain: '高光谱图像在空间域有平滑性（TV 约束），在光谱域有低秩性（核范数约束）。联合使用这两个约束可以更好地重建高光谱图像。',
        professionalExplain: '低秩+TV 模型： $\\hat{\\mathbf{X}} = \\arg\\min_{\\mathbf{X}} \\|\\mathbf{X}\\|_* + \\lambda_{\\text{TV}} \\|\\mathbf{X}\\|_{\\text{TV}} + \\frac{\\lambda}{2}\\|\\mathbf{Y} - \\Phi \\mathbf{X}\\|_F^2$ <br>其中： <br>1. $\\|\\mathbf{X}\\|_* = \\sum_i \\sigma_i$ 是核范数（奇异值之和，促进低秩）<br>2. $\\|\\mathbf{X}\\|_{\\text{TV}} = \\sum_{i,j} \\|\\nabla_{i,j} \\mathbf{X}\\|_2$ 是总变分（空间平滑）<br>3. $\\|\\cdot\\|_F$ 是 Frobenius 范数<br>符号特性： <br>- 低秩约束利用光谱相关性<br>- TV 约束利用空间平滑性<br>- 联合优化可以处理大规模问题。',
        example1d: '矩阵低秩性',
        scenario1d: '使用场景：将高光谱数据重新排列成矩阵（每行是一个像素的光谱，每列是一个波段的空间图像）。这个矩阵通常是低秩的（行之间相关），可以用低秩矩阵恢复方法。',
        code1d: 'import numpy as np\n# 低秩矩阵示例\n# 模拟高光谱矩阵（低秩）\nU = np.random.rand(100, 5)\nV = np.random.rand(5, 200)\nX_lowrank = U @ V  # 秩为5\nrank = np.linalg.matrix_rank(X_lowrank)\nprint(f"矩阵形状: {X_lowrank.shape}")\nprint(f"实际秩: {rank} (远小于 min(100, 200))")',
        output1d: '',
        hasError1d: false,
        example2d: '高光谱低秩+TV 重建',
        scenario2d: '使用场景：对高光谱数据立方体进行压缩感知重建。低秩约束利用光谱波段之间的相关性（相似波段有相似的空间分布），TV 约束保持空间边缘。这是高光谱 CS 重建的先进方法，可以处理大规模数据并获得高质量重建。',
        code2d: 'import numpy as np\n# 低秩+TV 重建思想\nH, W, B = 40, 40, 100\nX = np.random.rand(H, W, B)\n# 矩阵化（空间×光谱）\nX_matrix = X.reshape(H*W, B)\n# 低秩性\nrank = np.linalg.matrix_rank(X_matrix)\nprint(f"数据立方体: {H}x{W}x{B}")\nprint(f"矩阵化: {H*W} x {B}")\nprint(f"秩: {rank} (低秩特性)")',
        output2d: '',
        hasError2d: false,
        renderedFormula: ''
      },
      {
        concept: 'ADMM 算法<br>Alternating Direction Method of Multipliers',
        simpleExplain: 'ADMM 是求解带约束优化问题的迭代算法，特别适合处理 L1、低秩、TV 等非光滑正则化项。通过引入辅助变量和拉格朗日乘数，将复杂问题分解为简单子问题。',
        professionalExplain: 'ADMM 求解： $\\min f(x) + g(z)$ s.t. $Ax + Bz = c$ <br>增广拉格朗日： $L_\\rho(x, z, u) = f(x) + g(z) + u^T(Ax + Bz - c) + \\frac{\\rho}{2}\\|Ax + Bz - c\\|_2^2$ <br>迭代更新： <br>1. $x^{(k+1)} = \\arg\\min_x L_\\rho(x, z^{(k)}, u^{(k)})$ <br>2. $z^{(k+1)} = \\arg\\min_z L_\\rho(x^{(k+1)}, z, u^{(k)})$ <br>3. $u^{(k+1)} = u^{(k)} + \\rho(Ax^{(k+1)} + Bz^{(k+1)} - c)$ <br>符号特性： <br>- $\\rho$ 是惩罚参数<br>- ADMM 适合分布式计算<br>- 收敛速度：$O(1/k)$。',
        example1d: 'L1 最小化 ADMM',
        scenario1d: '使用场景：用 ADMM 求解 L1 最小化问题。将 $\\|x\\|_1$ 分离成辅助变量 $z$，然后交替更新 $x$ 和 $z$。ADMM 可以高效处理大规模 L1 问题。',
        code1d: 'import numpy as np\n# ADMM 求解 L1 最小化（简化）\nPhi = np.random.randn(10, 20)\ny = np.random.rand(10)\nx, z, u = np.zeros(20), np.zeros(20), np.zeros(20)\nrho = 1.0\nfor k in range(10):\n    # x 更新（最小二乘）\n    x = np.linalg.solve(Phi.T @ Phi + rho*np.eye(20), Phi.T @ y + rho*(z - u))\n    # z 更新（软阈值）\n    z = np.sign(x + u) * np.maximum(np.abs(x + u) - 1/rho, 0)\n    # u 更新\n    u = u + x - z\nprint(f"ADMM 迭代完成，x 非零数: {np.count_nonzero(np.abs(x) > 0.01)}")',
        output1d: '',
        hasError1d: false,
        example2d: '高光谱 ADMM 重建',
        scenario2d: '使用场景：用 ADMM 求解高光谱 CS 重建问题（低秩+TV）。将低秩约束、TV 约束和数据拟合项分离，交替优化。ADMM 可以高效处理大规模高光谱数据，是实际应用中的标准算法。',
        code2d: 'import numpy as np\n# ADMM 高光谱重建思想\nH, W, B = 30, 30, 80\nX = np.random.rand(H, W, B)\n# ADMM 迭代框架（简化）\nprint(f"ADMM 求解低秩+TV 重建")\nprint(f"数据规模: {H*W*B:,} 个变量")\nprint("ADMM 可以高效处理大规模问题")',
        output2d: '',
        hasError2d: false,
        renderedFormula: ''
      }
    ]

    // 相机模糊过程（Defocus）数据
    const defaultDefocusData = [
      {
        concept: '薄透镜成像模型<br>Thin Lens Model',
        simpleExplain: '相机镜头可以简化为薄透镜。物体发出的光线经过透镜聚焦，在像平面上形成清晰的像。当物体不在焦点位置时，像会变模糊。',
        professionalExplain: '薄透镜公式： $\\frac{1}{f} = \\frac{1}{s} + \\frac{1}{s\'}$ <br>其中： <br>- $f$ 是焦距<br>- $s$ 是物距（物体到透镜的距离）<br>- $s\'$ 是像距（像到透镜的距离）<br>符号特性： <br>1. 当 $s = \\infty$ 时，$s\' = f$（无穷远物体聚焦在焦平面）<br>2. 当物体不在焦点时，像平面上的点会扩散成圆斑（Circle of Confusion, CoC）<br>3. CoC 直径： $c = \\frac{D|s\' - s\'_f|}{s\'}$，其中 $D$ 是光圈直径，$s\'_f$ 是焦点像距。',
        example1d: '单点光源成像',
        scenario1d: '使用场景：一个点光源在不同距离时，经过透镜在像平面上的成像。当点光源在焦点位置时，成像为点；当不在焦点时，成像为模糊圆斑。这是理解 defocus 的基础。',
        code1d: 'import numpy as np\n# 薄透镜成像计算\nf = 50  # 焦距 50mm\ns = 1000  # 物距 1000mm\n# 计算像距\ns_prime = 1 / (1/f - 1/s)\nprint(f"焦距: {f}mm, 物距: {s}mm")\nprint(f"像距: {s_prime:.2f}mm")',
        output1d: '',
        hasError1d: false,
        example2d: '相机对焦',
        scenario2d: '使用场景：相机拍摄时，通过调整镜头位置（改变像距）使不同距离的物体清晰成像。当物体不在焦点时，像平面上的点扩散成圆斑，导致图像模糊。这是相机 defocus 的物理原理。',
        code2d: 'import numpy as np\n# 2D 点扩散函数（简化）\n# 当点光源 defocus 时，在像平面上形成圆斑\ncoordinate = np.meshgrid(np.arange(-10, 11), np.arange(-10, 11))\nr = np.sqrt(coordinate[0]**2 + coordinate[1]**2)\n# 圆斑（简化模型）\npsf = (r <= 3).astype(float)\nprint(f"Defocus PSF 形状: {psf.shape}")\nprint(f"圆斑半径: 3 像素")',
        output2d: '',
        hasError2d: false,
        renderedFormula: ''
      },
      {
        concept: '散焦模糊（Defocus Blur）<br>Defocus Blur',
        simpleExplain: '当物体不在相机焦点位置时，像平面上的点会扩散成圆斑，导致图像模糊。散焦程度取决于物体距离焦点的远近和光圈大小。',
        professionalExplain: '散焦圆斑直径（CoC）： $c = \\frac{D|s\' - s\'_f|}{s\'} = D \\left|\\frac{1}{s\'_f} - \\frac{1}{s\'}\\right| s\'$ <br>其中： <br>- $D$ 是光圈直径（$D = f/N$，$N$ 是 f-number）<br>- $s\'_f$ 是焦点像距<br>- $s\'$ 是实际像距<br>散焦模糊模型： $I_{\\text{blur}}(x, y) = I_{\\text{sharp}}(x, y) * h_{\\text{defocus}}(x, y)$ <br>其中 $h_{\\text{defocus}}$ 是圆盘形 PSF： $h(r) = \\begin{cases} 1/(\\pi c^2) & \\text{if } r \\le c/2 \\\\ 0 & \\text{otherwise} \\end{cases}$ <br>符号特性： <br>- 散焦模糊是空间不变的（所有位置使用相同的 PSF）<br>- CoC 大小与物体距离焦点的距离成正比。',
        example1d: '不同距离的模糊',
        scenario1d: '使用场景：拍摄不同距离的物体时，只有焦点位置的物体清晰，其他距离的物体会模糊。距离焦点越远，模糊程度越大。这是景深效果的原理。',
        code1d: 'import numpy as np\n# 散焦模糊计算\nf = 50  # 焦距\nN = 2.8  # f-number\nD = f / N  # 光圈直径\ns_focus = 1000  # 焦点物距\ns_object = 1500  # 物体物距\n# 计算像距\ns_prime_focus = 1 / (1/f - 1/s_focus)\ns_prime_object = 1 / (1/f - 1/s_object)\n# CoC 直径\ncoc = D * abs(1/s_prime_focus - 1/s_prime_object) * s_prime_object\nprint(f"散焦圆斑直径: {coc:.3f}mm")',
        output1d: '',
        hasError1d: false,
        example2d: '图像散焦模糊',
        scenario2d: '使用场景：相机拍摄时，如果对焦在某个距离，其他距离的物体会产生散焦模糊。模糊程度可以用圆盘形 PSF 建模，PSF 的半径由散焦距离和光圈大小决定。这是图像去模糊和深度估计的基础。',
        code2d: 'import numpy as np\nfrom scipy.signal import convolve2d\n# 2D 散焦模糊模拟\nimage_sharp = np.random.rand(50, 50)\n# 圆盘形 PSF（简化）\nr = 5  # 模糊半径\nx, y = np.meshgrid(np.arange(-r, r+1), np.arange(-r, r+1))\ndist = np.sqrt(x**2 + y**2)\npsf = (dist <= r).astype(float)\npsf = psf / psf.sum()\n# 卷积产生模糊\nimage_blur = convolve2d(image_sharp, psf, mode="same")\nprint(f"散焦模糊：PSF 半径 {r} 像素")',
        output2d: '',
        hasError2d: false,
        renderedFormula: ''
      },
      {
        concept: '散焦与物距的关系<br>Defocus vs Object Distance',
        simpleExplain: '物体距离相机越远或越近（相对于焦点），散焦程度越大。散焦圆斑的大小与物体到焦点的距离差成正比。',
        professionalExplain: '物距与像距关系： $s\' = \\frac{fs}{s - f}$ <br>散焦量： $\\Delta s\' = s\' - s\'_f = \\frac{fs}{s - f} - \\frac{fs_f}{s_f - f}$ <br>其中 $s_f$ 是焦点物距<br>CoC 与物距的关系： $c(s) = \\frac{Df}{s - f} \\left|\\frac{s - s_f}{s_f}\\right|$ <br>符号特性： <br>1. 当 $s = s_f$ 时，$c = 0$（无散焦）<br>2. 当 $|s - s_f|$ 增大时，$c$ 增大（散焦加剧）<br>3. 光圈越大（$D$ 越大），散焦越明显<br>4. 焦距越长（$f$ 越大），散焦越明显。',
        example1d: '不同物距的模糊程度',
        scenario1d: '使用场景：拍摄一组不同距离的物体，只有焦点位置的物体清晰，其他距离的物体模糊。距离焦点越远，模糊圆斑越大，图像越模糊。这是景深效果的定量描述。',
        code1d: 'import numpy as np\n# 不同物距的散焦计算\nf = 50\nN = 2.8\nD = f / N\ns_focus = 1000\n# 不同物体距离\ns_objects = [800, 1000, 1200, 1500]\nfor s in s_objects:\n    s_prime = f * s / (s - f)\n    s_prime_focus = f * s_focus / (s_focus - f)\n    coc = D * abs(s_prime - s_prime_focus) / s_prime\n    print(f"物距 {s}mm: CoC = {coc:.3f}mm")',
        output1d: '',
        hasError1d: false,
        example2d: '景深效果',
        scenario2d: '使用场景：相机拍摄时，通过调整对焦距离和光圈大小控制景深。焦点附近的物体清晰，远离焦点的物体模糊。散焦程度与物距的关系决定了景深的范围，这是摄影中控制背景虚化的原理。',
        code2d: 'import numpy as np\n# 2D 不同距离物体的散焦\nf = 50\nN = 2.8\nD = f / N\ns_focus = 1000\n# 模拟不同距离的物体\ns_objects = np.array([800, 1000, 1200, 1500])\n# 计算每个物体的 CoC\ncoc_values = []\nfor s in s_objects:\n    s_prime = f * s / (s - f)\n    s_prime_focus = f * s_focus / (s_focus - f)\n    coc = D * abs(s_prime - s_prime_focus) / s_prime\n    coc_values.append(coc)\nprint(f"不同距离的散焦圆斑: {np.array(coc_values).round(3)}")',
        output2d: '',
        hasError2d: false,
        renderedFormula: ''
      },
      {
        concept: 'Depth from Defocus (DFD)<br>从散焦估计深度',
        simpleExplain: '利用同一物体在不同对焦设置下的散焦程度差异，可以反推物体的深度（距离）。散焦程度越大，物体距离焦点越远。',
        professionalExplain: 'DFD 原理： 给定两个不同对焦设置的图像 $I_1, I_2$，散焦模糊不同： <br>$I_1(x, y) = I_{\\text{sharp}}(x, y) * h_1(x, y; s)$ <br>$I_2(x, y) = I_{\\text{sharp}}(x, y) * h_2(x, y; s)$ <br>其中 $h_1, h_2$ 是不同对焦设置下的 PSF，依赖于物体深度 $s$<br>深度估计： $\\hat{s} = \\arg\\min_s \\|I_1 - I_2 * (h_1^{-1} * h_2)\\|^2$ <br>或使用散焦量： $\\Delta s\'_1 - \\Delta s\'_2 = f\\left(\\frac{1}{s_1 - f} - \\frac{1}{s_2 - f}\\right) - f\\left(\\frac{1}{s - f}\\right)$ <br>符号特性： <br>- 需要至少两个不同对焦设置的图像<br>- 散焦差异越大，深度估计越准确<br>- 可以结合 CoC 大小直接估计深度。',
        example1d: '单点深度估计',
        scenario1d: '使用场景：拍摄同一个点光源，先用一个对焦设置拍一张，再用另一个对焦设置拍一张。比较两张图像中该点的模糊程度，可以反推点光源的距离。这是 DFD 的基本思想。',
        code1d: 'import numpy as np\n# DFD 深度估计（简化）\nf = 50\n# 两个对焦设置\ns1_focus = 800  # 第一个对焦距离\ns2_focus = 1200  # 第二个对焦距离\n# 物体真实距离（未知，待估计）\ns_true = 1000\n# 计算两个设置下的 CoC\ns1_prime = f * s1_focus / (s1_focus - f)\ns2_prime = f * s2_focus / (s2_focus - f)\ns_prime_true = f * s_true / (s_true - f)\ncoc1 = abs(s_prime_true - s1_prime) / s_prime_true\ncoc2 = abs(s_prime_true - s2_prime) / s_prime_true\nprint(f"对焦1的散焦: {coc1:.4f}, 对焦2的散焦: {coc2:.4f}")\nprint(f"散焦差异可用于估计深度")',
        output1d: '',
        hasError1d: false,
        example2d: '图像深度图估计',
        scenario2d: '使用场景：用相机在不同对焦设置下拍摄同一场景，得到多张散焦程度不同的图像。通过比较同一像素在不同图像中的模糊程度，可以估计该像素对应的物体深度，生成深度图。这是 DFD 在计算机视觉中的应用。',
        code2d: 'import numpy as np\nfrom scipy.signal import convolve2d\n# DFD 深度估计示例\n# 模拟两个不同对焦的图像\nimage_sharp = np.random.rand(30, 30)\n# 不同深度的物体产生不同的散焦\n# 深度1（近）\nr1 = 3\npsf1 = np.ones((2*r1+1, 2*r1+1)) / ((2*r1+1)**2)\nimage1 = convolve2d(image_sharp, psf1, mode="same")\n# 深度2（远）\nr2 = 5\npsf2 = np.ones((2*r2+1, 2*r2+1)) / ((2*r2+1)**2)\nimage2 = convolve2d(image_sharp, psf2, mode="same")\nprint(f"DFD: 通过比较模糊程度估计深度")\nprint(f"图像1模糊半径: {r1}, 图像2模糊半径: {r2}")',
        output2d: '',
        hasError2d: false,
        renderedFormula: ''
      },
      {
        concept: 'DFD 深度公式<br>DFD Depth Formula',
        simpleExplain: '从两个不同对焦设置的散焦量差异，可以直接计算物体的深度。公式将散焦圆斑大小、对焦设置和相机参数联系起来。',
        professionalExplain: 'DFD 深度公式： $s = \\frac{f(s_1\' s_2\' - s_1\' s_f\' + s_2\' s_f\')}{s_1\' s_2\' - f(s_1\' + s_2\') + f s_f\'}$ <br>简化形式（当 $s_f\' \\approx f$ 时）： $s \\approx \\frac{f(c_1 s_2\' - c_2 s_1\')}{c_1 s_2\' - c_2 s_1\' - f(c_1 - c_2)}$ <br>其中： <br>- $s_1\', s_2\'$ 是两个对焦设置的像距<br>- $c_1, c_2$ 是观测到的散焦圆斑直径<br>- $s_f\'$ 是焦点像距<br>实用公式： $s = \\frac{f}{1 - \\frac{f}{s_f\'} + \\frac{c_1 - c_2}{D(s_1\' - s_2\')}}$ <br>符号特性： <br>- 需要已知两个对焦设置和对应的散焦量<br>- 散焦差异越大，深度估计越准确<br>- 公式假设已知相机参数（$f, D$）。',
        example1d: '单点深度计算',
        scenario1d: '使用场景：已知两个对焦设置下的散焦圆斑大小，可以直接用公式计算物体的深度。这是 DFD 的核心公式，将观测（散焦程度）与未知量（深度）联系起来。',
        code1d: 'import numpy as np\n# DFD 深度公式计算\nf = 50\nD = 20  # 光圈直径\n# 两个对焦设置\ns1_focus = 800\ns2_focus = 1200\ns1_prime_focus = f * s1_focus / (s1_focus - f)\ns2_prime_focus = f * s2_focus / (s2_focus - f)\n# 物体真实距离（待估计）\ns_true = 1000\ns_prime_true = f * s_true / (s_true - f)\n# 计算散焦圆斑\nc1 = D * abs(s_prime_true - s1_prime_focus) / s_prime_true\nc2 = D * abs(s_prime_true - s2_prime_focus) / s_prime_true\n# DFD 公式估计深度（简化）\ns_estimated = f / (1 - f/s1_prime_focus + (c1 - c2) / (D * (s1_prime_focus - s2_prime_focus)))\nprint(f"真实深度: {s_true}mm, 估计深度: {s_estimated:.1f}mm")',
        output1d: '',
        hasError1d: false,
        example2d: '深度图重建',
        scenario2d: '使用场景：对图像中每个像素，从两个不同对焦设置的图像中提取散焦信息，用 DFD 公式计算该像素对应的深度。遍历所有像素，可以得到完整的深度图。这是 DFD 在 3D 重建中的应用。',
        code2d: 'import numpy as np\n# DFD 深度图计算（简化示例）\nf = 50\nD = 20\n# 模拟不同深度的区域\ns1_focus, s2_focus = 800, 1200\n# 不同深度的物体\ns_objects = np.array([700, 900, 1100, 1300])\n# 计算每个物体的深度估计\nfor s_true in s_objects:\n    s_prime = f * s_true / (s_true - f)\n    s1_pf = f * s1_focus / (s1_focus - f)\n    s2_pf = f * s2_focus / (s2_focus - f)\n    c1 = D * abs(s_prime - s1_pf) / s_prime\n    c2 = D * abs(s_prime - s2_pf) / s_prime\n    # 简化深度估计\n    s_est = f / (1 - f/s1_pf + (c1 - c2) / (D * (s1_pf - s2_pf)))\n    print(f"深度 {s_true}mm -> 估计 {s_est:.0f}mm")',
        output2d: '',
        hasError2d: false,
        renderedFormula: ''
      },
      {
        concept: '散焦测量方法<br>Defocus Measurement',
        simpleExplain: '如何从图像中测量散焦程度？可以通过分析图像的频率响应、边缘锐度、或直接估计 PSF 的大小来量化散焦。',
        professionalExplain: '散焦测量方法： <br>1. 频域方法： $\\text{Defocus} \\propto -\\log(\\text{高频能量})$ <br>   高频能量： $E_{\\text{high}} = \\sum_{\\omega > \\omega_c} |\\mathcal{F}(I)(\\omega)|^2$ <br>2. 梯度方法： $\\text{Defocus} \\propto \\|\\nabla I\\|_2$（模糊图像梯度小）<br>3. Laplacian 方法： $\\text{Defocus} \\propto -\\sum |\\nabla^2 I|$（模糊图像二阶导数小）<br>4. PSF 估计：直接估计散焦圆斑半径 $r$，然后 $c = 2r$<br>符号特性： <br>- 散焦越大，高频能量越小<br>- 散焦越大，图像梯度越小<br>- 可以通过多尺度分析提高鲁棒性。',
        example1d: '频域散焦测量',
        scenario1d: '使用场景：对信号做 FFT，分析高频分量的能量。散焦信号的高频能量小，清晰信号的高频能量大。通过比较高频能量可以量化散焦程度。',
        code1d: 'import numpy as np\n# 频域散焦测量\nsignal_sharp = np.array([0, 0, 1, 3, 2, 0, 0])\n# 模糊信号（卷积平滑）\nh = np.array([0.2, 0.6, 0.2])\nsignal_blur = np.convolve(signal_sharp, h, mode="same")\n# FFT\nfreq_sharp = np.fft.fft(signal_sharp)\nfreq_blur = np.fft.fft(signal_blur)\n# 高频能量（后一半频率）\nhigh_freq_sharp = np.sum(np.abs(freq_sharp[len(freq_sharp)//2:])**2)\nhigh_freq_blur = np.sum(np.abs(freq_blur[len(freq_blur)//2:])**2)\nprint(f"清晰信号高频能量: {high_freq_sharp:.2f}")\nprint(f"模糊信号高频能量: {high_freq_blur:.2f}")',
        output1d: '',
        hasError1d: false,
        example2d: '图像散焦测量',
        scenario2d: '使用场景：对图像计算梯度或 Laplacian，统计其幅值。清晰图像的边缘梯度大，模糊图像的边缘梯度小。通过分析梯度分布可以估计图像的散焦程度，这是 DFD 中测量散焦的关键步骤。',
        code2d: 'import numpy as np\nfrom scipy.signal import convolve2d\n# 2D 图像散焦测量\nimage_sharp = np.random.rand(30, 30)\n# 模糊图像\npsf = np.ones((5, 5)) / 25\nimage_blur = convolve2d(image_sharp, psf, mode="same")\n# 计算梯度\ngrad_sharp = np.sqrt(np.diff(image_sharp, axis=0)**2 + np.diff(image_sharp, axis=1)**2)\ngrad_blur = np.sqrt(np.diff(image_blur, axis=0)**2 + np.diff(image_blur, axis=1)**2)\nprint(f"清晰图像平均梯度: {np.mean(grad_sharp):.3f}")\nprint(f"模糊图像平均梯度: {np.mean(grad_blur):.3f}")',
        output2d: '',
        hasError2d: false,
        renderedFormula: ''
      },
      {
        concept: 'DFD 算法流程<br>DFD Algorithm',
        simpleExplain: 'DFD 的完整流程：1) 用不同对焦设置拍摄两张图像，2) 测量每张图像的散焦程度，3) 用散焦差异和 DFD 公式计算深度，4) 生成深度图。',
        professionalExplain: 'DFD 算法步骤： <br>1. 图像采集： $I_1(x, y; s_1\'), I_2(x, y; s_2\')$ <br>   两个不同对焦设置 $s_1\', s_2\'$<br>2. 散焦测量： $c_1(x, y), c_2(x, y)$ <br>   对每个像素估计散焦圆斑大小<br>3. 深度计算： $s(x, y) = f\\left(\\frac{1}{1 - f/s_f\' + \\frac{c_1 - c_2}{D(s_1\' - s_2\')}}\\right)$ <br>4. 深度图后处理：平滑、去噪、插值<br>符号特性： <br>- 需要已知相机参数：$f, D, s_1\', s_2\'$<br>- 散焦测量是关键步骤，影响深度精度<br>- 可以扩展到多对焦设置提高精度。',
        example1d: '1D 深度估计流程',
        scenario1d: '使用场景：对一维信号（如深度剖面），用两个不同对焦设置采集，测量每个位置的散焦，然后用 DFD 公式计算深度。这是理解 DFD 算法的简化版本。',
        code1d: 'import numpy as np\n# DFD 算法流程（1D 简化）\nf = 50\nD = 20\ns1_focus, s2_focus = 800, 1200\n# 步骤1: 采集两个对焦设置的信号\n# 步骤2: 测量散焦（简化：假设已知）\nc1 = np.array([0.1, 0.2, 0.15, 0.3])  # 不同位置的散焦\nc2 = np.array([0.05, 0.1, 0.08, 0.2])\n# 步骤3: 计算深度\ns1_pf = f * s1_focus / (s1_focus - f)\ns2_pf = f * s2_focus / (s2_focus - f)\ndepths = f / (1 - f/s1_pf + (c1 - c2) / (D * (s1_pf - s2_pf)))\nprint(f"估计的深度: {depths.round(0)}mm")',
        output1d: '',
        hasError1d: false,
        example2d: '完整 DFD 深度图重建',
        scenario2d: '使用场景：用相机在不同对焦设置下拍摄场景，得到多张图像。对每个像素：1) 提取该像素在不同图像中的值，2) 估计散焦程度，3) 用 DFD 公式计算深度。遍历所有像素得到完整深度图。这是 DFD 在 3D 重建、机器人导航、AR/VR 中的应用。',
        code2d: 'import numpy as np\nfrom scipy.signal import convolve2d\n# DFD 完整流程（2D）\n# 步骤1: 模拟两个对焦设置的图像\nimage_sharp = np.random.rand(40, 40)\n# 不同深度的区域产生不同散焦\npsf1 = np.ones((3, 3)) / 9  # 小散焦\npsf2 = np.ones((7, 7)) / 49  # 大散焦\nimage1 = convolve2d(image_sharp, psf1, mode="same")\nimage2 = convolve2d(image_sharp, psf2, mode="same")\n# 步骤2: 测量散焦（简化：用梯度）\ngrad1 = np.mean(np.abs(np.diff(image1)))\ngrad2 = np.mean(np.abs(np.diff(image2)))\n# 步骤3: 计算深度（简化）\nprint(f"DFD 算法：从散焦差异估计深度")\nprint(f"图像1平均梯度: {grad1:.3f}, 图像2: {grad2:.3f}")',
        output2d: '',
        hasError2d: false,
        renderedFormula: ''
      },
      {
        concept: 'DUAL Pixel 技术<br>DUAL Pixel Technology',
        simpleExplain: '每个像素分成左右两个光电二极管，分别接收来自镜头左右两侧的光线。通过比较两个子像素的信号差异，可以检测相位差，用于快速对焦和深度估计。',
        professionalExplain: 'DUAL Pixel 结构： 每个像素 $P$ 分成两个子像素 $P_L, P_R$ <br>子像素信号： $I_L(x, y) = \\int_{\\Omega_L} I_{\\text{scene}}(x\', y\') h_L(x\' - x, y\' - y) dx\'dy\'$ <br>$I_R(x, y) = \\int_{\\Omega_R} I_{\\text{scene}}(x\', y\') h_R(x\' - x, y\' - y) dx\'dy\'$ <br>其中 $\\Omega_L, \\Omega_R$ 是左右子像素的视角范围<br>相位差： $\\Delta \\phi(x, y) = \\arg(I_L^*(x, y) I_R(x, y))$ <br>或简化： $\\Delta \\phi \\approx \\frac{I_L - I_R}{I_L + I_R}$ <br>符号特性： <br>- 当物体在焦点时，$I_L \\approx I_R$，相位差 $\\approx 0$<br>- 当物体散焦时，左右子像素看到不同的模糊，产生相位差<br>- 相位差大小与散焦程度相关。<br><br>参考论文：<a href="https://ieeexplore.ieee.org/document/6247756" target="_blank">Dual Pixel Sensors for Phase Detection Autofocus (IEEE)</a> | <a href="https://www.samsung.com/semiconductor/insights/tech-blog/dual-pixel-technology/" target="_blank">Samsung Dual Pixel Technology</a>',
        example1d: '1D 相位检测',
        scenario1d: '使用场景：对一维信号，DUAL pixel 传感器可以检测左右视角的差异。当信号在焦点时，左右子像素的信号相同；当散焦时，信号会有相位差，可以用来快速对焦。',
        code1d: 'import numpy as np\n# DUAL Pixel 相位检测（1D）\n# 模拟左右子像素信号\nsignal_true = np.array([0, 0, 1, 3, 2, 0, 0])\n# 散焦时左右子像素看到不同的模糊\nh_left = np.array([0.3, 0.7, 0, 0, 0])  # 左偏模糊\nh_right = np.array([0, 0, 0.7, 0.3, 0])  # 右偏模糊\nI_L = np.convolve(signal_true, h_left, mode="same")\nI_R = np.convolve(signal_true, h_right, mode="same")\n# 相位差\nphase_diff = (I_L - I_R) / (I_L + I_R + 1e-10)\nprint(f"左子像素: {I_L.round(2)}")\nprint(f"右子像素: {I_R.round(2)}")\nprint(f"相位差: {phase_diff.round(3)}")',
        output1d: '',
        hasError1d: false,
        example2d: 'DUAL Pixel 对焦',
        scenario2d: '使用场景：现代手机相机使用 DUAL Pixel 技术实现快速自动对焦。每个像素的左右子像素分别检测来自镜头左右两侧的光线，通过比较相位差判断对焦状态。当相位差为0时，物体在焦点；相位差不为0时，可以快速调整对焦距离。这是相位检测自动对焦（PDAF）的基础。',
        code2d: 'import numpy as np\nfrom scipy.signal import convolve2d\n# DUAL Pixel 2D 相位检测\nimage_true = np.random.rand(30, 30)\n# 左右子像素的 PSF（不同方向）\npsf_left = np.array([[0.3, 0.7, 0], [0.3, 0.7, 0], [0.3, 0.7, 0]]) / 3\npsf_right = np.array([[0, 0.7, 0.3], [0, 0.7, 0.3], [0, 0.7, 0.3]]) / 3\nI_L = convolve2d(image_true, psf_left, mode="same")\nI_R = convolve2d(image_true, psf_right, mode="same")\n# 相位差图\nphase_diff = (I_L - I_R) / (I_L + I_R + 1e-10)\nprint(f"DUAL Pixel 相位差图: {phase_diff.shape}")\nprint(f"平均相位差: {np.mean(np.abs(phase_diff)):.3f}")',
        output2d: '',
        hasError2d: false,
        renderedFormula: ''
      },
      {
        concept: 'DUAL Pixel 深度估计<br>DUAL Pixel Depth Estimation',
        simpleExplain: '利用 DUAL Pixel 的相位差信息，可以直接估计深度，无需多次对焦。相位差的大小和方向与物体的深度和散焦程度相关。',
        professionalExplain: 'DUAL Pixel 深度公式： <br>相位差与散焦的关系： $\\Delta \\phi(x, y) = k \\cdot \\Delta s\'(x, y)$ <br>其中 $k$ 是比例常数，$\\Delta s\'$ 是散焦量<br>深度估计： $s(x, y) = \\frac{f}{1 - \\frac{f}{s_f\'} + \\frac{\\Delta \\phi(x, y)}{k D}}$ <br>或使用经验公式： $s = s_f \\cdot \\left(1 + \\alpha \\cdot \\Delta \\phi\\right)$ <br>其中 $\\alpha$ 是校准参数<br>符号特性： <br>- 相位差 $\\Delta \\phi$ 可以直接从 DUAL Pixel 数据计算<br>- 不需要多次对焦，单次拍摄即可估计深度<br>- 深度精度取决于相位差测量精度和校准质量。<br><br>参考论文：<a href="https://arxiv.org/abs/1712.00732" target="_blank">Depth from Defocus using Dual-Pixel Sensors (CVPR 2018)</a> | <a href="https://ieeexplore.ieee.org/document/9008470" target="_blank">Dual-Pixel Depth Estimation (IEEE)</a>',
        example1d: '1D 深度估计',
        scenario1d: '使用场景：从 DUAL Pixel 的左右子像素信号计算相位差，然后用相位差直接估计深度。这比传统的 DFD 方法更快，因为只需要一次拍摄。',
        code1d: 'import numpy as np\n# DUAL Pixel 深度估计（1D）\nf = 50\nD = 20\ns_focus = 1000\n# 模拟不同深度的相位差\ns_objects = np.array([800, 1000, 1200, 1500])\n# 计算每个物体的相位差（简化）\nfor s in s_objects:\n    s_prime = f * s / (s - f)\n    s_prime_focus = f * s_focus / (s_focus - f)\n    delta_s_prime = abs(s_prime - s_prime_focus)\n    # 相位差与散焦量成正比\n    phase_diff = 0.1 * delta_s_prime  # 简化比例\n    # 深度估计\n    alpha = 100  # 校准参数\n    s_estimated = s_focus * (1 + alpha * phase_diff)\n    print(f"深度 {s}mm: 相位差 {phase_diff:.4f}, 估计 {s_estimated:.0f}mm")',
        output1d: '',
        hasError1d: false,
        example2d: 'DUAL Pixel 深度图',
        scenario2d: '使用场景：现代手机相机（如 iPhone、Samsung）使用 DUAL Pixel 技术生成深度图。对每个像素计算左右子像素的相位差，然后用相位差估计深度，生成完整的深度图。这用于人像模式、背景虚化、AR 等应用。',
        code2d: 'import numpy as np\nfrom scipy.signal import convolve2d\n# DUAL Pixel 深度图生成\nimage = np.random.rand(40, 40)\n# 模拟左右子像素（不同深度区域有不同相位差）\npsf_left = np.array([[0.3, 0.7, 0], [0.3, 0.7, 0]]) / 2\npsf_right = np.array([[0, 0.7, 0.3], [0, 0.7, 0.3]]) / 2\nI_L = convolve2d(image, psf_left, mode="same")\nI_R = convolve2d(image, psf_right, mode="same")\n# 相位差图\nphase_diff = (I_L - I_R) / (I_L + I_R + 1e-10)\n# 深度估计（简化）\ndepth_map = 1000 * (1 + 100 * phase_diff)\nprint(f"DUAL Pixel 深度图: {depth_map.shape}")\nprint(f"深度范围: {depth_map.min():.0f}-{depth_map.max():.0f}mm")',
        output2d: '',
        hasError2d: false,
        renderedFormula: ''
      },
      {
        concept: 'Quad Pixel 技术<br>Quad Pixel Technology',
        simpleExplain: '每个像素分成四个子像素（上下左右），分别接收来自不同方向的光线。Quad Pixel 提供更丰富的相位信息，可以实现更精确的对焦和深度估计。',
        professionalExplain: 'Quad Pixel 结构： 每个像素 $P$ 分成四个子像素 $P_{TL}, P_{TR}, P_{BL}, P_{BR}$ <br>子像素信号： $I_{TL}(x, y), I_{TR}(x, y), I_{BL}(x, y), I_{BR}(x, y)$ <br>水平相位差： $\\Delta \\phi_H = \\frac{I_{TL} + I_{BL} - I_{TR} - I_{BR}}{I_{TL} + I_{TR} + I_{BL} + I_{BR}}$ <br>垂直相位差： $\\Delta \\phi_V = \\frac{I_{TL} + I_{TR} - I_{BL} - I_{BR}}{I_{TL} + I_{TR} + I_{BL} + I_{BR}}$ <br>总相位差： $\\Delta \\phi = \\sqrt{\\Delta \\phi_H^2 + \\Delta \\phi_V^2}$ <br>相位方向： $\\theta = \\arctan2(\\Delta \\phi_V, \\Delta \\phi_H)$ <br>符号特性： <br>- Quad Pixel 提供 2D 相位信息（水平和垂直）<br>- 可以检测任意方向的散焦<br>- 比 DUAL Pixel 更精确，但计算更复杂。<br><br>参考论文：<a href="https://ieeexplore.ieee.org/document/9010634" target="_blank">Quad-Bayer Pattern for Phase Detection (IEEE)</a> | <a href="https://www.sony-semicon.com/en/technology/imaging/quad-bayer.html" target="_blank">Sony Quad-Bayer Technology</a>',
        example1d: 'Quad Pixel 1D 分析',
        scenario1d: '使用场景：对一维信号，Quad Pixel 可以同时检测水平和垂直方向的相位差。虽然 1D 信号主要用水平相位差，但 Quad Pixel 结构提供了更鲁棒的测量。',
        code1d: 'import numpy as np\n# Quad Pixel 1D 分析（简化）\nsignal = np.array([0, 0, 1, 3, 2, 0, 0])\n# 四个子像素信号（简化：模拟不同方向）\nI_TL = signal * 0.9  # 左上\nI_TR = signal * 1.1  # 右上\nI_BL = signal * 0.95  # 左下\nI_BR = signal * 1.05  # 右下\n# 水平相位差\nphase_H = (I_TL + I_BL - I_TR - I_BR) / (I_TL + I_TR + I_BL + I_BR + 1e-10)\nprint(f"水平相位差: {phase_H.round(3)}")',
        output1d: '',
        hasError1d: false,
        example2d: 'Quad Pixel 对焦和深度',
        scenario2d: '使用场景：现代高端手机相机（如某些旗舰机型）使用 Quad Pixel 技术。四个子像素分别检测来自不同方向的光线，提供 2D 相位信息，可以实现更精确的自动对焦和深度估计。Quad Pixel 特别适合处理复杂场景和快速运动物体的对焦。',
        code2d: 'import numpy as np\nfrom scipy.signal import convolve2d\n# Quad Pixel 2D 相位检测\nimage = np.random.rand(30, 30)\n# 四个子像素的 PSF（不同方向）\npsf_TL = np.array([[0.4, 0.6, 0], [0.4, 0.6, 0], [0, 0, 0]]) / 2  # 左上\npsf_TR = np.array([[0, 0.6, 0.4], [0, 0.6, 0.4], [0, 0, 0]]) / 2  # 右上\npsf_BL = np.array([[0, 0, 0], [0.4, 0.6, 0], [0.4, 0.6, 0]]) / 2  # 左下\npsf_BR = np.array([[0, 0, 0], [0, 0.6, 0.4], [0, 0.6, 0.4]]) / 2  # 右下\nI_TL = convolve2d(image, psf_TL, mode="same")\nI_TR = convolve2d(image, psf_TR, mode="same")\nI_BL = convolve2d(image, psf_BL, mode="same")\nI_BR = convolve2d(image, psf_BR, mode="same")\n# 相位差\nphase_H = (I_TL + I_BL - I_TR - I_BR) / (I_TL + I_TR + I_BL + I_BR + 1e-10)\nphase_V = (I_TL + I_TR - I_BL - I_BR) / (I_TL + I_TR + I_BL + I_BR + 1e-10)\nphase_mag = np.sqrt(phase_H**2 + phase_V**2)\nprint(f"水平相位差范围: {phase_H.min():.3f} to {phase_H.max():.3f}")\nprint(f"垂直相位差范围: {phase_V.min():.3f} to {phase_V.max():.3f}")\nprint(f"总相位差: {phase_mag.mean():.3f}")',
        output2d: '',
        hasError2d: false,
        renderedFormula: ''
      },
      {
        concept: 'Quad Pixel 深度估计<br>Quad Pixel Depth Estimation',
        simpleExplain: '利用 Quad Pixel 的 2D 相位信息，可以更精确地估计深度。水平和垂直相位差提供了更丰富的散焦信息，特别适合处理复杂场景。',
        professionalExplain: 'Quad Pixel 深度公式： <br>2D 相位差： $\\boldsymbol{\\Delta \\phi} = [\\Delta \\phi_H, \\Delta \\phi_V]^T$ <br>相位差幅值： $|\\Delta \\phi| = \\sqrt{\\Delta \\phi_H^2 + \\Delta \\phi_V^2}$ <br>深度估计： $s(x, y) = s_f \\cdot \\left(1 + \\boldsymbol{\\alpha}^T \\boldsymbol{\\Delta \\phi}(x, y)\\right)$ <br>其中 $\\boldsymbol{\\alpha} = [\\alpha_H, \\alpha_V]^T$ 是校准向量<br>或使用非线性模型： $s = s_f \\cdot \\exp(\\beta |\\Delta \\phi|)$ <br>符号特性： <br>- 2D 相位信息提供更鲁棒的深度估计<br>- 可以处理各向异性的散焦（不同方向散焦不同）<br>- 相位方向 $\\theta$ 可以用于检测边缘方向<br>- 比 DUAL Pixel 更精确，但需要更复杂的校准。<br><br>参考论文：<a href="https://arxiv.org/abs/2008.09724" target="_blank">Quad-Bayer Depth Estimation (ECCV 2020)</a> | <a href="https://ieeexplore.ieee.org/document/9157500" target="_blank">Multi-Directional Phase Detection (IEEE)</a>',
        example1d: 'Quad Pixel 1D 深度',
        scenario1d: '使用场景：虽然 Quad Pixel 主要用于 2D 图像，但在 1D 信号中，四个子像素可以提供更鲁棒的相位测量，减少噪声影响，提高深度估计精度。',
        code1d: 'import numpy as np\n# Quad Pixel 深度估计（1D 简化）\ns_focus = 1000\n# 模拟四个子像素\nI_TL = np.array([1.0, 2.0, 3.0, 2.0, 1.0])\nI_TR = np.array([1.1, 2.1, 3.1, 2.1, 1.1])\nI_BL = np.array([0.95, 1.95, 2.95, 1.95, 0.95])\nI_BR = np.array([1.05, 2.05, 3.05, 2.05, 1.05])\n# 相位差\nphase_H = (I_TL + I_BL - I_TR - I_BR) / (I_TL + I_TR + I_BL + I_BR + 1e-10)\nphase_V = (I_TL + I_TR - I_BL - I_BR) / (I_TL + I_TR + I_BL + I_BR + 1e-10)\nphase_mag = np.sqrt(phase_H**2 + phase_V**2)\n# 深度估计\nalpha_H, alpha_V = 50, 50\ns_estimated = s_focus * (1 + alpha_H * phase_H + alpha_V * phase_V)\nprint(f"相位差幅值: {phase_mag.round(4)}")\nprint(f"估计深度: {s_estimated.round(0)}mm")',
        output1d: '',
        hasError1d: false,
        example2d: 'Quad Pixel 深度图',
        scenario2d: '使用场景：高端手机相机使用 Quad Pixel 技术生成高精度深度图。四个子像素提供 2D 相位信息，可以处理复杂场景（如纹理丰富、边缘复杂）的深度估计。Quad Pixel 深度图用于人像模式、3D 重建、AR/VR 等应用，精度比 DUAL Pixel 更高。',
        code2d: 'import numpy as np\nfrom scipy.signal import convolve2d\n# Quad Pixel 深度图生成\nimage = np.random.rand(40, 40)\n# 四个子像素（简化 PSF）\npsf_TL = np.array([[0.4, 0.6, 0], [0.4, 0.6, 0]]) / 2\npsf_TR = np.array([[0, 0.6, 0.4], [0, 0.6, 0.4]]) / 2\npsf_BL = np.array([[0.4, 0.6, 0], [0.4, 0.6, 0]]) / 2\npsf_BR = np.array([[0, 0.6, 0.4], [0, 0.6, 0.4]]) / 2\nI_TL = convolve2d(image, psf_TL, mode="same")\nI_TR = convolve2d(image, psf_TR, mode="same")\nI_BL = convolve2d(image, psf_BL, mode="same")\nI_BR = convolve2d(image, psf_BR, mode="same")\n# 2D 相位差\nphase_H = (I_TL + I_BL - I_TR - I_BR) / (I_TL + I_TR + I_BL + I_BR + 1e-10)\nphase_V = (I_TL + I_TR - I_BL - I_BR) / (I_TL + I_TR + I_BL + I_BR + 1e-10)\nphase_mag = np.sqrt(phase_H**2 + phase_V**2)\n# 深度估计\nalpha_H, alpha_V = 50, 50\ns_focus = 1000\ndepth_map = s_focus * (1 + alpha_H * phase_H + alpha_V * phase_V)\nprint(f"Quad Pixel 深度图: {depth_map.shape}")\nprint(f"深度范围: {depth_map.min():.0f}-{depth_map.max():.0f}mm")\nprint(f"平均相位差: {phase_mag.mean():.4f}")',
        output2d: '',
        hasError2d: false,
        renderedFormula: ''
      },
      {
        concept: 'DUAL vs Quad Pixel<br>DUAL vs Quad Pixel Comparison',
        simpleExplain: 'DUAL Pixel 提供 1D 相位信息（左右），Quad Pixel 提供 2D 相位信息（上下左右）。Quad Pixel 更精确但更复杂，DUAL Pixel 更简单但足够大多数应用。',
        professionalExplain: '对比： <br>1. 相位信息维度： <br>   - DUAL: $\\Delta \\phi \\in \\mathbb{R}$（1D，水平方向）<br>   - Quad: $\\boldsymbol{\\Delta \\phi} \\in \\mathbb{R}^2$（2D，水平+垂直）<br>2. 精度： <br>   - DUAL: 适合大多数场景，精度足够<br>   - Quad: 更高精度，特别适合复杂场景<br>3. 计算复杂度： <br>   - DUAL: $O(n)$（n 是像素数）<br>   - Quad: $O(n)$（相同，但常数更大）<br>4. 应用： <br>   - DUAL: 主流手机相机（iPhone, Samsung）<br>   - Quad: 高端旗舰机型<br>符号特性： <br>- Quad Pixel 可以检测任意方向的散焦<br>- DUAL Pixel 主要检测水平方向的散焦<br>- 两者都可以单次拍摄估计深度。',
        example1d: '相位信息对比',
        scenario1d: '使用场景：对于 1D 信号，DUAL Pixel 提供左右相位差，Quad Pixel 提供左右+上下相位差。虽然 1D 信号主要用水平相位差，但 Quad Pixel 的垂直信息可以提供额外的鲁棒性。',
        code1d: 'import numpy as np\n# DUAL vs Quad 对比（1D）\nsignal = np.array([1, 2, 3, 2, 1])\n# DUAL Pixel: 只有水平相位差\nI_L = signal * 0.9\nI_R = signal * 1.1\nphase_dual = (I_L - I_R) / (I_L + I_R + 1e-10)\n# Quad Pixel: 水平+垂直相位差\nI_TL, I_TR = signal * 0.9, signal * 1.1\nI_BL, I_BR = signal * 0.95, signal * 1.05\nphase_H = (I_TL + I_BL - I_TR - I_BR) / (I_TL + I_TR + I_BL + I_BR + 1e-10)\nphase_V = (I_TL + I_TR - I_BL - I_BR) / (I_TL + I_TR + I_BL + I_BR + 1e-10)\nprint(f"DUAL 相位差: {phase_dual.round(4)}")\nprint(f"Quad 水平相位差: {phase_H.round(4)}")\nprint(f"Quad 垂直相位差: {phase_V.round(4)}")',
        output1d: '',
        hasError1d: false,
        example2d: '实际应用对比',
        scenario2d: '使用场景：DUAL Pixel 技术（如 iPhone 的 Focus Pixels）已经足够大多数应用，包括快速对焦、人像模式、背景虚化。Quad Pixel 技术（某些高端 Android 机型）提供更高精度，特别适合专业摄影、AR/VR 等需要高精度深度的应用。选择取决于应用需求和成本考虑。',
        code2d: 'import numpy as np\n# DUAL vs Quad 应用对比\n# DUAL Pixel: 简单高效\nphase_dual = np.random.rand(30, 30) * 0.1 - 0.05  # 小相位差\ndepth_dual = 1000 * (1 + 50 * phase_dual)\n# Quad Pixel: 更精确\nphase_H = np.random.rand(30, 30) * 0.1 - 0.05\nphase_V = np.random.rand(30, 30) * 0.05 - 0.025\nphase_mag = np.sqrt(phase_H**2 + phase_V**2)\ndepth_quad = 1000 * (1 + 50 * phase_H + 50 * phase_V)\nprint(f"DUAL Pixel 深度图: {depth_dual.shape}")\nprint(f"Quad Pixel 深度图: {depth_quad.shape}")\nprint(f"Quad 提供 2D 相位信息，精度更高")',
        output2d: '',
        hasError2d: false,
        renderedFormula: ''
      }
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
        const rlCategory = {
          name: 'Richardson-Lucy 反卷积算法',
          data: ref([...defaultRLData]),
          expanded: false,
          id: null
        }
        const inverseProblemCategory = {
          name: '逆问题（Inverse Problem）',
          data: ref([...defaultInverseProblemData]),
          expanded: false,
          id: null
        }
        const compressedSensingCategory = {
          name: '压缩感知高光谱图像重建',
          data: ref([...defaultCompressedSensingData]),
          expanded: false,
          id: null
        }
        const defocusCategory = {
          name: '相机散焦过程（Defocus）',
          data: ref([...defaultDefocusData]),
          expanded: false,
          id: null
        }
        
        categoryMap.set('概率论', probabilityCategory)
        categoryMap.set('优化理论', optimizationCategory)
        categoryMap.set('Richardson-Lucy 反卷积算法', rlCategory)
        categoryMap.set('逆问题（Inverse Problem）', inverseProblemCategory)
        categoryMap.set('压缩感知高光谱图像重建', compressedSensingCategory)
        categoryMap.set('相机散焦过程（Defocus）', defocusCategory)
        
        // 如果在线，初始化数据到云端
        if (dataStore.isOnline && dataStore.currentLanguage === 'math') {
          initCategoriesToCloud([probabilityCategory, optimizationCategory, rlCategory, inverseProblemCategory, compressedSensingCategory, defocusCategory])
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
    
    // 编辑概念相关的状态
    const showEditItemDialog = ref(false)
    const editingItem = ref({
      categoryName: '',
      itemIndex: -1,
      itemData: {
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

    // 显示编辑概念对话框
    const showEditItemDialogFunc = (categoryName, itemIndex) => {
      try {
        const category = categories.value.find(cat => cat.name === categoryName)
        if (!category) {
          alert('找不到该学科')
          return
        }
        
        // 获取数据数组（可能是 ref 或普通数组）
        const dataArray = Array.isArray(category.data) ? category.data : category.data?.value
        if (!dataArray || !dataArray[itemIndex]) {
          alert('找不到该概念')
          return
        }

        const item = dataArray[itemIndex]
        
        // 深拷贝数据，避免直接引用
        editingItem.value = {
          categoryName,
          itemIndex,
          itemData: {
            concept: item.concept || '',
            simpleExplain: item.simpleExplain || '',
            professionalExplain: item.professionalExplain || '',
            example1d: item.example1d || '',
            scenario1d: item.scenario1d || '',
            code1d: item.code1d || '',
            example2d: item.example2d || '',
            scenario2d: item.scenario2d || '',
            code2d: item.code2d || '',
            output1d: item.output1d || '',
            hasError1d: item.hasError1d || false,
            output2d: item.output2d || '',
            hasError2d: item.hasError2d || false,
            renderedFormula: item.renderedFormula || ''
          }
        }
        
        showEditItemDialog.value = true
      } catch (error) {
        console.error('打开编辑对话框失败:', error)
        alert('打开编辑对话框失败：' + error.message)
      }
    }

    // 确认编辑概念
    const confirmEditItem = async () => {
      if (!canEditItem.value) {
        alert('请至少填写概念名称和人话解释')
        return
      }

      try {
        const category = categories.value.find(cat => cat.name === editingItem.value.categoryName)
        if (!category || !category.data.value[editingItem.value.itemIndex]) {
          alert('找不到该概念')
          return
        }

        // 更新本地数据
        const item = category.data.value[editingItem.value.itemIndex]
        Object.assign(item, editingItem.value.itemData)

        // 保存到云端
        await saveCategory(editingItem.value.categoryName)

        cancelEditItem()
        alert('概念修改成功！')
        
        // 等待 DOM 更新后重新渲染公式
        await nextTick()
        await renderCategoryFormulas(category)
      } catch (error) {
        console.error('修改概念失败:', error)
        alert('修改概念失败：' + error.message)
      }
    }

    // 取消编辑概念
    const cancelEditItem = () => {
      showEditItemDialog.value = false
      editingItem.value = {
        categoryName: '',
        itemIndex: -1,
        itemData: {
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
    }

    // 检查是否可以编辑（至少需要概念名称和人话解释）
    const canEditItem = computed(() => {
      return editingItem.value.itemData.concept?.trim() && 
             editingItem.value.itemData.simpleExplain?.trim()
    })

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
      deleteItem,
      showEditItemDialog,
      editingItem,
      showEditItemDialogFunc,
      confirmEditItem,
      cancelEditItem,
      canEditItem
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

.item-actions {
  display: flex;
  gap: 0.3rem;
  flex-shrink: 0;
}

.edit-item-btn,
.delete-item-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 0.3rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.3s ease;
  opacity: 0.7;
  flex-shrink: 0;
  pointer-events: auto;
  position: relative;
  z-index: 10;
}

.delete-item-btn {
  background: #dc3545;
}

.edit-item-btn:hover {
  opacity: 1;
  transform: scale(1.1);
  background: #5568d3;
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
  max-width: 300px;
  min-width: 250px;
  line-height: 1.6;
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

/* 专业解释中的链接样式 */
.math-formula a,
.tg-g6kh a {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  border-bottom: 1px solid #667eea;
  transition: all 0.3s ease;
  margin: 0 0.3rem;
}

.math-formula a:hover,
.tg-g6kh a:hover {
  color: #764ba2;
  border-bottom-color: #764ba2;
  background: rgba(102, 126, 234, 0.1);
  padding: 0 0.2rem;
  border-radius: 3px;
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
