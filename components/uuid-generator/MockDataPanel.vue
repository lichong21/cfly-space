<script lang="ts" setup>
import { ref } from 'vue';
import { useCopy } from '@/composables/useCopy';

const { copied, copy } = useCopy();

const count = ref(5);
const selectedTypes = ref<string[]>(['name', 'phone', 'email']);
const results = ref<Array<Record<string, string>>>([]);

const typeOptions = [
  { key: 'name', label: '姓名' },
  { key: 'phone', label: '手机号' },
  { key: 'email', label: '邮箱' },
  { key: 'idcard', label: '身份证号' },
  { key: 'ip', label: 'IP 地址' },
  { key: 'datetime', label: '日期时间' },
];

// Mock data generators
const SURNAMES = '赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜戚谢邹喻柏水窦章云苏潘葛奚范彭郎鲁韦昌马苗凤花方俞任袁柳唐罗薛'.split('');
const GIVEN_NAMES = '伟芳娜敏静丽强磊洋勇艳杰娟涛超明华雪慧婷飞博玲鑫龙凤辉斌峰萍桂兰英'.split('');
const EMAIL_DOMAINS = ['qq.com', '163.com', 'gmail.com', 'outlook.com', 'foxmail.com'];

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function genName(): string {
  const surname = randItem(SURNAMES);
  const givenLen = Math.random() > 0.5 ? 2 : 1;
  const given = Array.from({ length: givenLen }, () => randItem(GIVEN_NAMES)).join('');
  return surname + given;
}

function genPhone(): string {
  const prefixes = ['130', '131', '132', '133', '135', '136', '137', '138', '139', '150', '151', '152', '153', '155', '156', '157', '158', '159', '170', '176', '177', '178', '180', '181', '182', '183', '185', '186', '187', '188', '189'];
  return randItem(prefixes) + String(randInt(10000000, 99999999));
}

function genEmail(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const len = randInt(6, 12);
  const name = Array.from({ length: len }, () => chars[randInt(0, chars.length - 1)]).join('');
  return `${name}@${randItem(EMAIL_DOMAINS)}`;
}

function genIdCard(): string {
  const areaCodes = ['110101', '310101', '440305', '330102', '510104', '320106', '420106', '500103'];
  const area = randItem(areaCodes);
  const year = randInt(1970, 2005);
  const month = String(randInt(1, 12)).padStart(2, '0');
  const day = String(randInt(1, 28)).padStart(2, '0');
  const seq = String(randInt(0, 999)).padStart(3, '0');
  const base = `${area}${year}${month}${day}${seq}`;
  // Checksum
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const checkChars = '10X98765432';
  const sum = base.split('').reduce((s, c, i) => s + Number(c) * weights[i], 0);
  return base + checkChars[sum % 11];
}

function genIp(): string {
  return `${randInt(1, 255)}.${randInt(0, 255)}.${randInt(0, 255)}.${randInt(1, 254)}`;
}

function genDatetime(): string {
  const ts = randInt(Date.now() - 365 * 86400000, Date.now() + 365 * 86400000);
  return new Date(ts).toLocaleString('zh-CN', { hour12: false });
}

const generators: Record<string, () => string> = {
  name: genName,
  phone: genPhone,
  email: genEmail,
  idcard: genIdCard,
  ip: genIp,
  datetime: genDatetime,
};

function generate() {
  results.value = Array.from({ length: count.value }, () => {
    const row: Record<string, string> = {};
    for (const type of selectedTypes.value) {
      row[type] = generators[type]();
    }
    return row;
  });
}

function getLabel(key: string): string {
  return typeOptions.find(t => t.key === key)?.label ?? key;
}

async function copyAll() {
  const header = selectedTypes.value.map(getLabel).join('\t');
  const rows = results.value.map(r => selectedTypes.value.map(t => r[t]).join('\t'));
  await copy([header, ...rows].join('\n'));
}

generate();
</script>

<template>
  <div>
    <div class="config-row">
      <div class="type-checks">
        <label v-for="opt in typeOptions" :key="opt.key" class="check">
          <input type="checkbox" :value="opt.key" v-model="selectedTypes" />
          <span>{{ opt.label }}</span>
        </label>
      </div>
      <label class="cfg">
        <span class="cfg-label">条数</span>
        <input v-model.number="count" type="number" min="1" max="50" class="cfg-input small" />
      </label>
      <button class="btn-primary" @click="generate" :disabled="selectedTypes.length === 0">生成</button>
      <button class="btn-outline" @click="copyAll" :disabled="results.length === 0">
        {{ copied ? '已复制' : '复制全部' }}
      </button>
    </div>

    <div v-if="results.length > 0" class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th v-for="type in selectedTypes" :key="type">{{ getLabel(type) }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in results" :key="i">
            <td class="row-num">{{ i + 1 }}</td>
            <td v-for="type in selectedTypes" :key="type">
              <code>{{ row[type] }}</code>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.config-row { display: flex; align-items: flex-end; gap: 12px; margin-bottom: 14px; flex-wrap: wrap; }
.type-checks { display: flex; gap: 10px; flex-wrap: wrap; }
.check { display: flex; align-items: center; gap: 3px; font-size: 12px; color: #374151; cursor: pointer; }
.cfg { display: flex; flex-direction: column; gap: 4px; }
.cfg-label { font-size: 11px; color: #6b7280; font-weight: 600; }
.cfg-input { padding: 6px 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; color: #374151; outline: none; }
.cfg-input.small { width: 70px; }
.btn-primary { padding: 7px 16px; border: none; border-radius: 6px; background: #1a73e8; color: #fff; font-size: 13px; font-weight: 500; cursor: pointer; }
.btn-primary:hover { background: #1557b0; }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-outline { padding: 7px 16px; border: 1px solid #e5e7eb; border-radius: 6px; background: #fff; font-size: 13px; color: #6b7280; cursor: pointer; }
.btn-outline:hover:not(:disabled) { border-color: #1a73e8; color: #1a73e8; }
.btn-outline:disabled { opacity: 0.4; cursor: not-allowed; }

.table-wrapper { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th { background: #f9fafb; padding: 8px 12px; text-align: left; font-weight: 600; color: #6b7280; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
.data-table td { padding: 6px 12px; border-bottom: 1px solid #f3f4f6; }
.data-table code { font-family: 'SF Mono', Monaco, monospace; color: #374151; font-size: 12px; }
.row-num { color: #9ca3af; font-size: 11px; width: 30px; }
</style>
