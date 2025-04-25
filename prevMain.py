# BAR DATA
bd_dic = {}
for i in finaldata:
    if not i[4]:
        continue
    try:
        val1, val2, val3 = int(i[7]), int(i[8]), int(i[9])
    except (TypeError, ValueError):
        continue
    bd_dic.setdefault(i[4], [0, 0, 0])
    bd_dic[i[4]][0] += val1
    bd_dic[i[4]][1] += val2
    bd_dic[i[4]][2] += val3

l2 = list(reversed(bd_dic.keys()))
bd = [[bd_dic[dt][i] for dt in reversed(bd_dic.keys())] for i in range(3)]

# LINE DATA
from datetime import datetime

ld_dic = {}
for i in range(len(l2)):
    try:
        dt = datetime.strptime(l2[i], "%d-%m-%Y")
        month = dt.strftime("%B")
    except Exception:
        continue
    ld_dic.setdefault(month, [0, 0, 0])
    ld_dic[month][0] += bd[0][i]
    ld_dic[month][1] += bd[1][i]
    ld_dic[month][2] += bd[2][i]

month_order = ["January", "February", "March", "April", "May", "June",
               "July", "August", "September", "October", "November", "December"]

l1 = [m for m in month_order if m in ld_dic]
ld = [[ld_dic[m][i] for m in l1] for i in range(3)]
