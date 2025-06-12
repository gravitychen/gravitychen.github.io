import pandas as pd
import re
import io

# 加载你的分类映射信息
category_map = {
    "✅ “刚…就…”、“刚发生某事，紧接着…”": [4, 5, 9, 31, 87, 183, 184],
    "✅ 在…期间/时候，趁着…": [2, 3, 6, 7, 18, 19, 21, 23],
    "✅ 在…之后，（基于前一个动作）…": [1, 15, 16, 42],
    "✅ 经过一系列动作或过程，最终…": [32, 40],
    "✅ 既然…就…": [33, 34, 36],
    "✅ 既然…就…": [	33, 34, 36	],
    "✅ 当然会…，理所当然地…": [	44, 45	],
    "✅ 动作进行到一半__未完成": [	35	],
    "✅ 动作发生后就再也没…": [	37	],
    "✅ 彻底完成__做到极限": [	38, 43	],
    "✅ 不…就可以解决__避免了…": [	41	],
    "✅ 取决于…，根据…而定": [	39	],
    "✅ 随着…，与…同时发生": [	20, 24, 27	],
    "✅ 越…越…": [	28, 30	],
    "✅ 在…之前，先于…": [	25	],
    "✅ 每当…，每次…": [	11, 26	],
    "✅ 一边…一边…": [	13	],
    "✅ 正在…（状态进行中）": [	14	],
    "✅ 顺便做…": [	12	],
    "✅ 一…就…（表示结果或后续行动）": [	8	],
    "✅ 刚…（表示时间不久）": [	10	],
    "✅ 在…（地点）": [	22	],
    "✅ 差一点就…，险些…": [	17	],
    "✅ 时隔…又…": [	29	],
    "✅ 持续某种趋势__状态，不断…": [	46	],
    "✅ 倾向于…，容易…": [	47, 51	],
    "✅ 稍微__有点…": [	48	],
    "✅ 看起来__显得…": [	49, 89	],
    "✅ 满是…，都是…": [	50	],
    "✅ 就那样__照着…": [	52, 90	],
    "✅ 因为__由于…（表示原因、理由、契机或根据）": [	53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 185	],
    "✅ 如果__只要…（表示条件或限定）": [	66, 67, 68, 69, 70, 71, 72, 73	],
    "✅ 虽然__即使…但是…（表示转折或逆接）": [	74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85	],
    "✅ 关于__至于…（表示提及或限定范围）": [	86	],
    "✅ 列举同类事物或行为": [	88, 97	],
    "✅ 表示排除、例外或比较": [	91, 93, 94	],
    "✅ 表示强调或并列": [	95, 96, 197	],
    "✅ 在…方面__从…上来看": [	98, 101, 102, 105, 109, 177, 178, 179, 180, 181	],
    "✅ 仅限于__只有__最好是": [	99, 100, 103, 104, 106, 107, 110	],
    "✅ 持续时间__范围": [	108	],
    "✅ 一方面…另一方面…": [	111, 118	],
    "✅ 代替__交换": [	112	],
    "✅ 每…": [	113, 116	],
    "✅ 与其说…不如说…": [	114	],
    "✅ 就…而言": [	115	],
    "✅ 与…相反": [	117	],
    "✅ 虽然…但是…": [	119	],
    "✅ 单从…来看": [	120	],
    "✅ 取决于…": [	121	],
    "✅ 根据…__按照…": [	122, 124, 125, 126, 128, 129	],
    "✅ 相应…__应…": [	123	],
    "✅ 不…（表示否定、省略或不顾）": [	130, 131, 133, 137, 139	],
    "✅ 除了…之外__不仅…而且…（表示追加或强调）": [	132, 134, 135, 136, 140	],
    "✅ 以…为中心__围绕…": [	138, 141, 142	],
    "✅ 打算__意图": [	143, 144	],
    "✅ 听说__表示传闻": [	145, 146	],
    "✅ 并非__不见得…": [	147, 154	],
    "✅ 一定__肯定__必然": [	148, 149, 150	],
    "✅ 不会__不应…": [	151, 155, 174, 199	],
    "✅ 无法__没办法…": [	152, 195	],
    "✅ 看上去好像…但其实…": [	153	],
    "✅ 提议__呼吁": [	156	],
    "✅ 可能__能": [	157	],
    "✅ 不可能__不能": [	158, 188	],
    "✅ 有……的危险__恐怕会…": [	159, 161	],
    "✅ 难以__很难…": [	160, 162	],
    "✅ 应该_必须": [	163, 165, 166, 172, 173, 191	],
    "✅ 没必要__用不着…": [	164	],
    "✅ 不能一直__总是…": [	167, 168	],
    "✅ 不是不…__并非不…": [	169, 170, 171	],
    "✅ 有…的价值__回报": [	176	],
    "✅ 强调、感叹、程度": [	182, 186, 187, 189, 190, 192, 198, 200	],
    "✅ 别说……__不是……的时候": [	193, 194	],
    "✅ 没想到…__想都没想过…": [	196	],
}



# 创建编号到类别的反向映射
id_to_category = {}
for category, ids in category_map.items():
    for id_ in ids:
        id_to_category[str(id_)] = category

# 读取 Markdown 表格为 DataFrame
# def read_markdown_table(file_path):
#     with open(file_path, encoding='utf-8') as f:
#         lines = f.readlines()
#     # 正确顺序：先 strip 再匹配
#     content_lines = [line.strip() for line in lines if line.strip().startswith('|')]
#     content = '\n'.join(content_lines)
#     print(f"==>> content:\n{content}")
    
#     df = pd.read_csv(io.StringIO(content), sep='|', engine='python', skiprows=1).dropna(axis=1, how='all')
#     df.columns = [col.strip() for col in df.columns]
#     print('>>> df.columns  ',df.columns)
#     df = df.applymap(lambda x: str(x).strip())
#     assert 1==2
#     return df


def read_markdown_table(file_path):
    with open(file_path, encoding='utf-8') as f:
        lines = f.readlines()
    # 先提取以 | 开头的行，并且剔除纯分隔线行（多为包含多个'-'的行）
    content_lines = []
    for line in lines:
        line_strip = line.strip()
        if line_strip.startswith('|'):
            # 过滤分隔线行（只包含 | - 空格 的行）
            if set(line_strip) <= set('|- '):
                continue
            content_lines.append(line_strip)

    content = '\n'.join(content_lines)
    print(f"==>> content:\n{content}")

    # 读取成 DataFrame
    df = pd.read_csv(io.StringIO(content), sep='|', engine='python')
    # 删除空白列（首尾的空列）
    df = df.dropna(axis=1, how='all')
    # 列名去空格
    df.columns = [col.strip() for col in df.columns]
    # 内容去空格
    df = df.applymap(lambda x: str(x).strip())
    return df


# 添加“分类”字段
def categorize(df):
    df['分类'] = df['编号'].apply(lambda x: id_to_category.get(str(x).strip(), '未分类'))
    return df

# 写入新的整理后的 Markdown 文件
def write_grouped_markdown(df, output_path):
    with open(output_path, 'w', encoding='utf-8') as f:
        for category in sorted(df['分类'].unique()):
            f.write(f"## {category}\n\n")
            group = df[df['分类'] == category].drop(columns=['分类'])
            f.write(group.to_markdown(index=False))
            f.write("\n\n")

# 主函数入口
def main():
    input_path = "N2-grammar-furikana.md"
    output_path = "sorted_my_markdown.md"
    df = read_markdown_table(input_path)
    df = categorize(df)
    write_grouped_markdown(df, output_path)
    print(f"已成功生成分类整理后的表格文件：{output_path}")

if __name__ == "__main__":
    main()
