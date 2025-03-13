import * as Yup from 'npm:yup';

// TODO: Agent should track and manage emotion deltas
export class FormAgent {
  public formData: { [key: string]: string | null };
  public formErrors: { [key: string]: string | null };
  public formValidationSchema: Yup.Schema;

  constructor() {
    // Initialize form params
    this.formData = {
      name: null
    }

    this.formErrors = {
      name: null
    }

    this.formValidationSchema = Yup.object().shape({
      name: Yup
        .string()
        .trim()
        .required('Name is required')
        .matches(
          /^[A-Za-z]+\s[A-Za-z]+$/,
          'First and last name required'
        ),
    })
  }

  private async validateForm() {
    try {
      // Set abortEarly to false to collect all errors.
      await this.formValidationSchema.validate(this.formData, { abortEarly: false });
    } catch (err) {
      if (err instanceof Yup.ValidationError) {
        const errors: { [key: string]: string } = {};

        // Yup aggregates errors in the `inner` array.
        (err as Yup.ValidationError).inner.forEach((error: Yup.ValidationError) => {
          if (error.path) errors[error.path] = error.message;
        });

        this.formErrors = errors;
      }

      // If the error isn't a Yup.ValidationError, rethrow it.
      throw err;
    }
  }

  public async updateForm({ field, value }: { field: string, value: string }) {
    this.formData[field] = value;
    this.formErrors[field] = null; // Remove error until revalidation

    // Validate and set errors
    await this.validateForm();
  }

  public formIsComplete(): boolean {
    const allFilled = Object.keys(this.formData).every((field) => this.formData[field] != null);
    const noErrors = Object.keys(this.formErrors).every((field) => this.formErrors[field] == null);
    return allFilled && noErrors;
  }

  public getDataAndErrors() {
    return Object.keys(this.formData).reduce((data, field) => ({
      ...data,
      [field]: {
        value: this.formData[field],
        error: this.formErrors[field]
      }
    }), {})
  }

  public logForm() {
    console.log("Final Form: ")
    for (const [key, value] of Object.entries(this.formData)) {
      console.log(`${key}: ${value}`);
    }
  }
}
