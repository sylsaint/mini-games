<script>
 import MathSubject from './MathSubject.svelte';
 import ChineseSubject from './ChineseSubject.svelte';
 import EnglishSubject from './EnglishSubject.svelte';
 import ScienceSubject from './ScienceSubject.svelte';
 import ComputingSubject from './ComputingSubject.svelte';
 let {subject='math'}=$props();
 const subjects={math:MathSubject,chinese:ChineseSubject,english:EnglishSubject,science:ScienceSubject,computing:ComputingSubject};
 const Page=$derived(subjects[subject]||MathSubject);
</script>
<Page />
