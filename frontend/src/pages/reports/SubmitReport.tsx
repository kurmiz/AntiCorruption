import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SubmitReportForm from '../../components/forms/SubmitReportForm';
import {
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  FileText,
  Clock,
  Shield
} from 'lucide-react';
import '../../styles/submit-report-form.css';

const SubmitReport: React.FC = () => {
  const navigate = useNavigate();
  const [submissionStatus, setSubmissionStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
    reportId?: string;
    trackingId?: string;
  }>({ type: null, message: '' });

  const handleSubmitSuccess = (reportId: string) => {
    // Generate tracking ID from report ID
    const trackingId = reportId.slice(-8).toUpperCase();
    
    setSubmissionStatus({
      type: 'success',
      message: 'Your report has been submitted successfully!',
      reportId,
      trackingId
    });

    // Scroll to top to show success message
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitError = (error: string) => {
    setSubmissionStatus({
      type: 'error',
      message: error
    });

    // Scroll to top to show error message
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  const handleViewReports = () => {
    navigate('/reports');
  };

  const handleSubmitAnother = () => {
    setSubmissionStatus({ type: null, message: '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Success State
  if (submissionStatus.type === 'success') {
    return (
      <div className="submit-report-page">
        <div className="success-container">
          <div className="success-header">
            <div className="success-icon">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <h1 className="success-title">Report Submitted Successfully!</h1>
            <p className="success-subtitle">
              Thank you for your courage in reporting corruption. Your report helps build a more transparent society.
            </p>
          </div>

          <div className="success-details">
            <div className="detail-card">
              <div className="detail-header">
                <FileText className="h-5 w-5 text-blue-500" />
                <h3>Report Information</h3>
              </div>
              <div className="detail-content">
                <div className="detail-item">
                  <span className="detail-label">Report ID:</span>
                  <span className="detail-value">{submissionStatus.reportId}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Tracking ID:</span>
                  <span className="detail-value tracking-id">{submissionStatus.trackingId}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Status:</span>
                  <span className="detail-value status-pending">
                    <Clock className="h-4 w-4" />
                    Pending Review
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Submitted:</span>
                  <span className="detail-value">{new Date().toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="detail-card">
              <div className="detail-header">
                <Shield className="h-5 w-5 text-green-500" />
                <h3>What Happens Next?</h3>
              </div>
              <div className="detail-content">
                <div className="next-steps">
                  <div className="step">
                    <div className="step-number">1</div>
                    <div className="step-content">
                      <h4>Initial Review</h4>
                      <p>Your report will be reviewed by our team within 24-48 hours</p>
                    </div>
                  </div>
                  <div className="step">
                    <div className="step-number">2</div>
                    <div className="step-content">
                      <h4>Investigation Assignment</h4>
                      <p>If valid, your report will be assigned to the appropriate authority</p>
                    </div>
                  </div>
                  <div className="step">
                    <div className="step-number">3</div>
                    <div className="step-content">
                      <h4>Regular Updates</h4>
                      <p>You'll receive notifications about the progress of your report</p>
                    </div>
                  </div>
                  <div className="step">
                    <div className="step-number">4</div>
                    <div className="step-content">
                      <h4>Resolution</h4>
                      <p>You'll be notified when action is taken or the case is resolved</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="success-actions">
            <button onClick={handleGoToDashboard} className="primary-btn">
              <ArrowLeft className="h-4 w-4" />
              Go to Dashboard
            </button>
            <button onClick={handleViewReports} className="secondary-btn">
              <FileText className="h-4 w-4" />
              View My Reports
            </button>
            <button onClick={handleSubmitAnother} className="tertiary-btn">
              Submit Another Report
            </button>
          </div>

          <div className="important-note">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <div>
              <h4>Important Note</h4>
              <p>
                Please save your <strong>Tracking ID: {submissionStatus.trackingId}</strong> for future reference. 
                You can use this ID to track the status of your report.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (submissionStatus.type === 'error') {
    return (
      <div className="submit-report-page">
        <div className="error-container">
          <div className="error-header">
            <div className="error-icon">
              <AlertTriangle className="h-16 w-16 text-red-500" />
            </div>
            <h1 className="error-title">Submission Failed</h1>
            <p className="error-subtitle">
              We encountered an error while submitting your report. Please try again.
            </p>
          </div>

          <div className="error-details">
            <div className="error-message">
              <h3>Error Details:</h3>
              <p>{submissionStatus.message}</p>
            </div>
          </div>

          <div className="error-actions">
            <button onClick={handleSubmitAnother} className="primary-btn">
              Try Again
            </button>
            <button onClick={handleGoToDashboard} className="secondary-btn">
              <ArrowLeft className="h-4 w-4" />
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Form State
  return (
    <div className="submit-report-page">
      <div className="page-header">
        <button onClick={() => navigate(-1)} className="back-button">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div className="header-content">
          <h1 className="page-title">Submit Corruption Report</h1>
          <p className="page-description">
            Report corruption incidents safely and securely. Your identity will be protected and your report will be handled confidentially.
          </p>
        </div>
      </div>

      <SubmitReportForm
        onSuccess={handleSubmitSuccess}
        onError={handleSubmitError}
      />
    </div>
  );
};

export default SubmitReport;
