;(() => {
  const initPersianDatepicker = () => {
    const displayInput = document.getElementById('register-birth-date-fa')
    const valueInput = document.getElementById('register-birth-date')

    if (!displayInput || !valueInput) return

    if (!window.jalaliDatepicker) {
      console.error('JalaliDatePicker library is not loaded.')
      return
    }

    window.jalaliDatepicker.startWatch({
      selector: '#register-birth-date-fa',

      date: true,
      time: false,

      maxDate: 'today',

      targetValueInput: '#register-birth-date',
      targetValueType: 'gregorian',

      persianDigits: true,

      autoShow: true,
      autoHide: true,
      autoReadOnlyInput: true,

      hideAfterChange: true,

      showTodayBtn: false,
      showEmptyBtn: true,
      showCloseBtn: true,

      useDropdownYears: true,

      position: 'center',
      zIndex: 9999,
    })

    // Fallback for browsers/environments where focus alone does not open it.
    displayInput.addEventListener('click', () => {
      window.jalaliDatepicker.show(displayInput)
    })

    // The library emits jdp:change on the visible Jalali input.
    // Re-dispatch input/change from the hidden Gregorian field so
    // the form controller can clear birthDate validation errors.
    displayInput.addEventListener('jdp:change', () => {
      valueInput.dispatchEvent(new Event('input', { bubbles: true }))
      valueInput.dispatchEvent(new Event('change', { bubbles: true }))
    })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPersianDatepicker, {
      once: true,
    })
  } else {
    initPersianDatepicker()
  }
})()
