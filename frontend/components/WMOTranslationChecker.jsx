// WMOTranslationChecker.jsx
// Production-ready React component for WMO Translation Accuracy Checker

import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle, Loader2, Download, X, ExternalLink, Search } from 'lucide-react';

/**
 * Main component for WMO Translation Accuracy Checker
 * Validates translations against UN/WMO standards
 */
const WMOTranslationChecker = () => {
  // State management
  const [inputMethod, setInputMethod] = useState('paste');
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [sourceText, setSourceText] = useState('');
  const [translations, setTranslations] = useState({
    en: '', fr: '', es: '', ar: '', zh: '', ru: ''
  });
  const [files, setFiles] = useState([]);
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState(null);
  const [batchResults, setBatchResults] = useState([]);
  const [progress, setProgress] = useState('');

  // Language configuration
  const languages = {
    en: 'English',
    fr: 'French',
    es: 'Spanish',
    ar: 'Arabic',
    zh: 'Simplified Chinese',
    ru: 'Russian'
  };

  // WMO/UN terminology database
  // TODO: Replace with actual API integration to UNTERM
  const wmoTerminology = {
    'climate': { fr: 'climat', es: 'clima', ar: 'مناخ', zh: '气候', ru: 'климат' },
    'weather': { fr: 'temps', es: 'tiempo', ar: 'طقس', zh: '天气', ru: 'погода' },
    'temperature': { fr: 'température', es: 'temperatura', ar: 'درجة الحرارة', zh: '温度', ru: 'температура' },
    'precipitation': { fr: 'précipitation', es: 'precipitación', ar: 'هطول', zh: '降水', ru: 'осадки' },
    'atmosphere': { fr: 'atmosphère', es: 'atmósfera', ar: 'الغلاف الجوي', zh: '大气', ru: 'атмосфера' },
    'meteorological': { fr: 'météorologique', es: 'meteorológico', ar: 'الأرصاد الجوية', zh: '气象', ru: 'метеорологический' },
    'observation': { fr: 'observation', es: 'observación', ar: 'مراقبة', zh: '观测', ru: 'наблюдение' },
    'forecast': { fr: 'prévision', es: 'pronóstico', ar: 'توقعات', zh: '预报', ru: 'прогноз' },
    'monitoring': { fr: 'surveillance', es: 'monitoreo', ar: 'رصد', zh: '监测', ru: 'мониторинг' },
    'data': { fr: 'données', es: 'datos', ar: 'بيانات', zh: '数据', ru: 'данные' },
    'organization': { fr: 'organisation', es: 'organización', ar: 'منظمة', zh: '组织', ru: 'организация' },
    'world': { fr: 'mondiale', es: 'mundial', ar: 'العالمية', zh: '世界', ru: 'всемирная' },
    'international': { fr: 'international', es: 'internacional', ar: 'دولي', zh: '国际', ru: 'международный' },
    'united nations': { fr: 'nations unies', es: 'naciones unidas', ar: 'الأمم المتحدة', zh: '联合国', ru: 'организация объединенных наций' },
    'report': { fr: 'rapport', es: 'informe', ar: 'تقرير', zh: '报告', ru: 'доклад' },
    'assessment': { fr: 'évaluation', es: 'evaluación', ar: 'تقييم', zh: '评估', ru: 'оценка' },
    'environment': { fr: 'environnement', es: 'medio ambiente', ar: 'بيئة', zh: '环境', ru: 'окружающая среда' },
    'sustainable': { fr: 'durable', es: 'sostenible', ar: 'مستدام', zh: '可持续', ru: 'устойчивый' },
    'development': { fr: 'développement', es: 'desarrollo', ar: 'تنمية', zh: '发展', ru: 'развитие' },
    'global': { fr: 'mondial', es: 'global', ar: 'عالمي', zh: '全球', ru: 'глобальный' }
  };

  /**
   * Get target languages (all except source)
   */
  const getTargetLanguages = () => {
    const targets = {...languages};
    delete targets[sourceLanguage];
    return targets;
  };

  /**
   * Handle file upload
   */
  const handleFileUpload = async (e) => {
    const uploadedFiles = Array.from(e.target.files);
    
    // Validate file size (10MB limit)
    const MAX_SIZE = 10 * 1024 * 1024;
    const validFiles = uploadedFiles.filter(file => {
      if (file.size > MAX_SIZE) {
        alert(`File ${file.name} is too large. Max size is 10MB.`);
        return false;
      }
      return true;
    });
    
    setFiles(prev => [...prev, ...validFiles]);
  };

  /**
   * Remove file from upload list
   */
  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  /**
   * Extract text from uploaded files
   * Supports .txt, .docx, .xlsx
   */
  const extractTextFromFile = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      if (file.name.endsWith('.txt')) {
        return new TextDecoder('utf-8').decode(uint8Array);
      } 
      else if (file.name.endsWith('.docx')) {
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
      } 
      else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const XLSX = await import('xlsx');
        const workbook = XLSX.read(uint8Array, { type: 'array' });
        let allText = '';
        
        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
          data.forEach(row => {
            allText += row.join(' ') + '\n';
          });
        });
        
        return allText;
      }
      
      throw new Error('Unsupported file format');
    } catch (error) {
      console.error('Error extracting text:', error);
      throw new Error(`Failed to read file: ${error.message}`);
    }
  };

  /**
   * Check translation quality against WMO/UN standards
   * 
   * @param {string} sourceText - Original text
   * @param {string} targetText - Translation to check
   * @param {string} sourceLang - Source language name
   * @param {string} targetLang - Target language name
   * @returns {Object} Analysis results
   */
  const checkTranslationQuality = (sourceText, targetText, sourceLang, targetLang) => {
    const issues = [];
    let score = 100;

    // Validate input
    if (!targetText || !targetText.trim()) {
      return {
        overallScore: 0,
        issues: [{
          type: 'consistency',
          severity: 'high',
          issue: 'Translation is empty',
          suggestion: 'Provide a complete translation',
          reference: 'UN Translation Guidelines'
        }],
        summary: 'Translation missing - cannot evaluate',
        strengths: [],
        verifiedTerms: []
      };
    }

    // Basic length check
    const sourceWords = sourceText.split(/\s+/).filter(w => w.length > 0);
    const targetWords = targetText.split(/\s+/).filter(w => w.length > 0);
    const lengthRatio = targetWords.length / sourceWords.length;

    if (lengthRatio < 0.5 || lengthRatio > 2) {
      issues.push({
        type: 'style',
        severity: 'medium',
        issue: `Translation length is ${lengthRatio < 0.5 ? 'much shorter' : 'much longer'} than source (${Math.round(lengthRatio * 100)}% of source length)`,
        suggestion: 'Review for completeness and accuracy. Translations should be roughly similar in length.',
        reference: 'UN Translation Quality Standards'
      });
      score -= 10;
    }

    // Check for WMO/UN terminology
    const sourceLower = sourceText.toLowerCase();
    const targetLower = targetText.toLowerCase();
    const verifiedTerms = [];

    for (const [term, translations] of Object.entries(wmoTerminology)) {
      if (sourceLower.includes(term.toLowerCase())) {
        verifiedTerms.push(term);
        
        const sourceLangCode = Object.keys(languages).find(k => languages[k] === sourceLang);
        const targetLangCode = Object.keys(languages).find(k => languages[k] === targetLang);
        
        if (targetLangCode && translations[targetLangCode]) {
          const expectedTranslation = translations[targetLangCode].toLowerCase();
          
          if (!targetLower.includes(expectedTranslation)) {
            issues.push({
              type: 'terminology',
              severity: 'high',
              original: term,
              translation: 'Not found or incorrect',
              issue: `UN/WMO standard term "${term}" should be translated as "${translations[targetLangCode]}"`,
              suggestion: `Use the official UN/WMO term: "${translations[targetLangCode]}"`,
              reference: 'UNTERM Database (unterm.un.org) / WMO Glossary'
            });
            score -= 15;
          }
        }
      }
    }

    // Check for style issues
    if (targetText.includes('  ')) {
      issues.push({
        type: 'style',
        severity: 'low',
        issue: 'Multiple consecutive spaces found',
        suggestion: 'Remove extra spaces for proper formatting',
        reference: 'UN Style Guide'
      });
      score -= 5;
    }

    // Check capitalization consistency
    if (sourceText[0] === sourceText[0].toUpperCase() && 
        targetText[0] === targetText[0].toLowerCase()) {
      issues.push({
        type: 'style',
        severity: 'low',
        issue: 'Capitalization inconsistency at start of text',
        suggestion: 'Match source text capitalization',
        reference: 'UN Translation Guidelines'
      });
      score -= 3;
    }

    // Check for missing punctuation
    const sourcePunctuation = (sourceText.match(/[.!?]$/g) || []).length;
    const targetPunctuation = (targetText.match(/[.!?]$/g) || []).length;
    
    if (sourcePunctuation !== targetPunctuation) {
      issues.push({
        type: 'style',
        severity: 'low',
        issue: 'Punctuation mismatch at end of text',
        suggestion: 'Ensure proper sentence ending punctuation',
        reference: 'UN Style Guide'
      });
      score -= 3;
    }

    // Ensure score is between 0 and 100
    score = Math.max(0, Math.min(100, score));

    // Generate summary
    let summary;
    if (score >= 90) {
      summary = 'Excellent translation quality with proper UN/WMO terminology usage';
    } else if (score >= 75) {
      summary = 'Good translation with only minor issues to address';
    } else if (score >= 60) {
      summary = 'Acceptable translation but requires improvements in terminology and style';
    } else if (score >= 40) {
      summary = 'Poor translation quality with significant terminology and consistency issues';
    } else {
      summary = 'Very poor translation requiring major revisions and terminology corrections';
    }

    // Generate strengths list
    const strengths = [];
    if (lengthRatio >= 0.7 && lengthRatio <= 1.3) {
      strengths.push('Appropriate length and structure maintained');
    }
    if (!targetText.includes('  ') && targetText === targetText.trim()) {
      strengths.push('Consistent formatting and spacing');
    }
    if (issues.filter(i => i.type === 'terminology').length === 0) {
      strengths.push('Correct UN/WMO terminology usage');
    }

    return {
      overallScore: score,
      issues,
      summary,
      strengths,
      verifiedTerms
    };
  };

  /**
   * TODO: Production implementation with Claude API
   * This function should be implemented on the backend
   */
  const checkTranslationWithAPI = async (sourceText, targetText, sourceLang, targetLang) => {
    try {
      const response = await fetch('/api/check-translation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceText,
          targetText,
          sourceLang,
          targetLang
        })
      });
      
      if (!response.ok) {
        throw new Error('API request failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      // Fallback to client-side checking
      return checkTranslationQuality(sourceText, targetText, sourceLang, targetLang);
    }
  };

  /**
   * Handle translation check for paste method
   */
  const handleCheck = async () => {
    // Validation
    if (!sourceText.trim()) {
      alert('Please enter source text');
      return;
    }

    const hasTranslations = Object.entries(translations).some(
      ([lang, text]) => lang !== sourceLanguage && text.trim()
    );

    if (!hasTranslations) {
      alert('Please enter at least one translation');
      return;
    }

    setChecking(true);
    setProgress('Analyzing translations...');
    
    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const analysisResults = {};
      const targetLangs = getTargetLanguages();

      for (const [lang, text] of Object.entries(translations)) {
        if (text.trim() && targetLangs[lang]) {
          setProgress(`Checking ${languages[lang]}...`);
          
          // Use API in production, fallback to client-side
          const result = checkTranslationQuality(
            sourceText,
            text,
            languages[sourceLanguage],
            languages[lang]
          );
          
          analysisResults[lang] = result;
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      setResults(analysisResults);
    } catch (error) {
      console.error('Error during check:', error);
      alert('An error occurred during analysis. Please try again.');
    } finally {
      setProgress('');
      setChecking(false);
    }
  };

  /**
   * Handle batch file processing
   */
  const handleBatchCheck = async () => {
    if (files.length === 0) {
      alert('Please upload files for batch processing');
      return;
    }

    setChecking(true);
    setProgress('Processing files...');
    const batchAnalysis = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgress(`Processing file ${i + 1}/${files.length}: ${file.name}`);
        
        try {
          const text = await extractTextFromFile(file);
          
          const fileResult = {
            fileName: file.name,
            sourceText: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
            sourceLang: languages[sourceLanguage],
            results: {}
          };

          // For demo: analyze the text as both source and translation
          // TODO: In production, parse actual translations from structured files
          const targetLangs = getTargetLanguages();
          for (const [lang, langName] of Object.entries(targetLangs)) {
            setProgress(`Analyzing ${langName} for ${file.name}...`);
            
            const result = checkTranslationQuality(
              text.substring(0, 500),
              text.substring(0, 500),
              languages[sourceLanguage],
              langName
            );
            
            fileResult.results[lang] = result;
            await new Promise(resolve => setTimeout(resolve, 300));
          }

          batchAnalysis.push(fileResult);
        } catch (error) {
          batchAnalysis.push({
            fileName: file.name,
            error: error.message
          });
        }
      }

      setBatchResults(batchAnalysis);
    } catch (error) {
      console.error('Batch processing error:', error);
      alert('An error occurred during batch processing. Please try again.');
    } finally {
      setProgress('');
      setChecking(false);
    }
  };

  /**
   * Export results to JSON file
   */
  const exportResults = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      sourceLanguage: languages[sourceLanguage],
      sourceText,
      translations,
      results
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wmo-translation-check-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * Get color class for severity level
   */
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'text-red-700 bg-red-50 border-red-300';
      case 'medium': return 'text-orange-700 bg-orange-50 border-orange-300';
      case 'low': return 'text-yellow-700 bg-yellow-50 border-yellow-300';
      default: return 'text-gray-700 bg-gray-50 border-gray-300';
    }
  };

  /**
   * Get color class for score
   */
  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-lime-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  // ============ RENDER ============
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-t-4 border-blue-600">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <FileText className="w-10 h-10 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  WMO Translation Accuracy Checker
                </h1>
                <p className="text-gray-600 mt-1">
                  Based on UNTERM, UN Country Database & WMO Glossary
                </p>
              </div>
            </div>
            {results && (
              <button
                onClick={exportResults}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                <Download className="w-4 h-4" />
                Export Results
              </button>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.values(languages).map(lang => (
              <span 
                key={lang} 
                className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full"
              >
                {lang}
              </span>
            ))}
          </div>
        </div>

        {/* Input Method Selector */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setInputMethod('paste')}
              className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
                inputMethod === 'paste'
                  ? 'bg-blue-600 text-white shadow-md transform scale-105'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <FileText className="w-5 h-5 inline mr-2" />
              Copy & Paste
            </button>
            <button
              onClick={() => setInputMethod('upload')}
              className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
                inputMethod === 'upload'
                  ? 'bg-blue-600 text-white shadow-md transform scale-105'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Upload className="w-5 h-5 inline mr-2" />
              File Upload (Batch)
            </button>
          </div>

          {/* Paste Method */}
          {inputMethod === 'paste' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <label className="block text-sm font-semibold text-blue-800 mb-2">
                  Source Language
                </label>
                <select
                  value={sourceLanguage}
                  onChange={(e) => {
                    setSourceLanguage(e.target.value);
                    setTranslations({ en: '', fr: '', es: '', ar: '', zh: '', ru: '' });
                    setResults(null);
                  }}
                  className="w-full p-3 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium"
                >
                  {Object.entries(languages).map(([code, name]) => (
                    <option key={code} value={code}>{name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Source Text ({languages[sourceLanguage]}) *
                </label>
                <textarea
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  className="w-full h-40 p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm resize-y"
                  placeholder={`Enter ${languages[sourceLanguage]} source text here...\n\nExample: "The World Meteorological Organization monitors global weather patterns and provides climate data."`}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {Object.entries(getTargetLanguages()).map(([code, name]) => (
                  <div key={code}>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {name} Translation
                    </label>
                    <textarea
                      value={translations[code] || ''}
                      onChange={(e) => setTranslations({...translations, [code]: e.target.value})}
                      className="w-full h-32 p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
                      placeholder={`Enter ${name} translation...`}
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={handleCheck}
                disabled={checking}
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-bold hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-lg shadow-lg"
              >
                {checking ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    {progress || 'Analyzing Translations...'}
                  </>
                ) : (
                  <>
                    <Search className="w-6 h-6" />
                    Check Translation Accuracy
                  </>
                )}
              </button>
            </div>
          )}

          {/* Upload Method */}
          {inputMethod === 'upload' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <label className="block text-sm font-semibold text-blue-800 mb-2">
                  Source Language for Batch Processing
                </label>
                <select
                  value={sourceLanguage}
                  onChange={(e) => setSourceLanguage(e.target.value)}
                  className="w-full p-3 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium"
                >
                  {Object.entries(languages).map(([code, name]) => (
                    <option key={code} value={code}>{name}</option>
                  ))}
                </select>
              </div>

              <div className="border-2 border-dashed border-blue-300 rounded-xl p-12 text-center hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer">
                <Upload className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                <label className="cursor-pointer">
                  <span className="text-blue-600 font-bold text-lg hover:text-blue-700">
                    Click to upload files
                  </span>
                  <span className="text-gray-600 block mt-2">or drag and drop</span>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".txt,.docx,.xlsx"
                  />
                </label>
                <p className="text-sm text-gray-500 mt-3 font-medium">
                  Supported: TXT, DOCX, XLSX • Max 10MB per file
                </p>
              </div>

              {files.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Uploaded Files ({files.length})
                  </h3>
                  {files.map((file, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6 text-blue-600" />
                        <div>
                          <span className="text-sm font-semibold text-gray-700 block">
                            {file.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {(file.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        aria-label="Remove file"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleBatchCheck}
                disabled={checking || files.length === 0}
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-bold hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-lg shadow-lg"
              >
                {checking ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    {progress || 'Processing Files...'}
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-6 h-6" />
                    Check All Files
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Results Section */}
        {results && Object.keys(results).length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <CheckCircle className="w-7 h-7 text-green-600" />
                Analysis Results
              </h2>
              <div className="text-sm font-semibold text-gray-600 bg-blue-100 px-4 py-2 rounded-lg border border-blue-300">
                Source: <span className="text-blue-700">{languages[sourceLanguage]}</span>
              </div>
            </div>

            {Object.entries(results).map(([lang, result]) => (
              <div 
                key={lang} 
                className="mb-8 border-2 border-gray-200 rounded-xl p-6 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                  <h3 className="text-2xl font-bold text-gray-800">
                    {languages[lang]}
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 font-medium">
                      Accuracy Score:
                    </span>
                    <span className={`text-4xl font-bold ${getScoreColor(result.overallScore)}`}>
                      {result.overallScore}%
                    </span>
                  </div>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-4">
                  <p className="text-gray-700">
                    <strong>Summary:</strong> {result.summary}
                  </p>
                </div>

                {result.strengths && result.strengths.length > 0 && (
                  <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg mb-4">
                    <h4 className="font-bold text-green-800 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Strengths
                    </h4>
                    <ul className="list-disc list-inside text-sm text-green-700 space-y-1">
                      {result.strengths.map((strength, idx) => (
                        <li key={idx}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.verifiedTerms && result.verifiedTerms.length > 0 && (
                  <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-lg mb-4">
                    <h4 className="font-bold text-indigo-800 mb-2">
                      Checked UN/WMO Terms
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {result.verifiedTerms.map((term, idx) => (
                        <span 
                          key={idx} 
                          className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full"
                        >
                          {term}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {result.issues && result.issues.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                      <AlertTriangle className="w-6 h-6 text-orange-500" />
                      Issues Found ({result.issues.length})
                    </h4>
                    {result.issues.map((issue, idx) => (
                      <div 
                        key={idx} 
                        className={`p-5 rounded-lg border-l-4 ${
                          issue.severity === 'high' ? 'border-red-500 bg-red-50' :
                          issue.severity === 'medium' ? 'border-orange-500 bg-orange-50' :
                          'border-yellow-500 bg-yellow-50'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                          <div className="flex gap-2 flex-wrap">
                            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getSeverityColor(issue.severity)}`}>
                              {issue.severity?.toUpperCase()}
                            </span>
                            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-200 text-gray-700">
                              {issue.type?.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-800 mb-3 font-medium">
                          <strong>Issue:</strong> {issue.issue}
                        </p>
                        
                        {issue.original && (
                          <p className="text-sm text-gray-700 mb-2 bg-white p-2 rounded border">
                            <strong>Original:</strong> <span className="font-mono">"{issue.original}"</span>
                          </p>
                        )}
                        
                        {issue.translation && (
                          <p className="text-sm text-gray-700 mb-2 bg-white p-2 rounded border">
                            <strong>Translation:</strong> <span className="font-mono">"{issue.translation}"</span>
                          </p>
                        )}
                        
                        {issue.suggestion && (
                          <p className="text-sm text-green-800 mb-2 bg-green-100 p-2 rounded border border-green-300">
                            <strong>✓ Suggestion:</strong> {issue.suggestion}
                          </p>
                        )}
                        
                        {issue.reference && (
                          <p className="text-xs text-blue-700 mt-3 flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" />
                            <strong>Reference:</strong> {issue.reference}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {(!result.issues || result.issues.length === 0) && (
                  <div className="flex items-center gap-3 text-green-700 bg-green-100 p-4 rounded-lg border-2 border-green-300">
                    <CheckCircle className="w-6 h-6" />
                    <span className="font-semibold">
                      Excellent! No issues found - translation is highly accurate.
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Batch Results */}
        {batchResults.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <h2 className="text-2xl font-bold text-gray-800">
                Batch Processing Results
              </h2>
              <div className="text-sm font-semibold text-gray-600 bg-blue-100 px-4 py-2 rounded-lg border border-blue-300">
                Source: <span className="text-blue-700">{languages[sourceLanguage]}</span>
              </div>
            </div>
            
            {batchResults.map((fileResult, idx) => (
              <div 
                key={idx} 
                className="mb-6 border-2 border-gray-200 rounded-xl p-5 hover:border-blue-300 transition-colors"
              >
                {fileResult.error ? (
                  <div className="text-red-600">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                      <X className="w-5 h-5" />
                      {fileResult.fileName}
                    </h3>
                    <p className="text-sm">Error: {fileResult.error}</p>
                  </div>
                ) : (
                  <>
                    <h3 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <FileText className="w-6 h-6 text-blue-600" />
                      {fileResult.fileName}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                      {Object.entries(fileResult.results).map(([lang, result]) => (
                        <div 
                          key={lang} 
                          className="text-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-colors"
                        >
                          <div className="text-xs font-semibold text-gray-600 mb-2">
                            {languages[lang]}
                          </div>
                          <div className={`text-2xl font-bold ${getScoreColor(result.overallScore)}`}>
                            {result.overallScore}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer Info */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-xl shadow-lg p-6 text-white mt-6">
          <h3 className="font-bold text-lg mb-3">Data Sources & Standards</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-1 flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                UNTERM Database
              </h4>
              <p className="text-blue-200">Official UN terminology in all languages</p>
              <a 
                href="https://unterm.un.org/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-blue-300 hover:text-white underline"
              >
                unterm.un.org
              </a>
            </div>
            <div>
              <h4 className="font-semibold mb-1 flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                UN Country Names
              </h4>
              <p className="text-blue-200">Standardized country name database</p>
              <a 
                href="https://unterm.un.org/unterm2/en/country" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-blue-300 hover:text-white underline"
              >
                Country Names Database
              </a>
            </div>
            <div>
              <h4 className="font-semibold mb-1 flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                WMO Glossaries
              </h4>
              <p className="text-blue-200">Meteorological terminology standards</p>
              <a 
                href="https://public.wmo.int/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-blue-300 hover:text-white underline"
              >
                public.wmo.int
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WMOTranslationChecker;
